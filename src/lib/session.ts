import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient, supabaseConfigured, transaction, type Row } from "./db";
import { hashPassword, verifyPassword } from "./password";
import { seedCatalog } from "./seed";
import type { Membership, Organization, Profile, ProjectMember, Role, UserRow } from "./types";

export class AppError extends Error {}

const UID = "cimenta_uid";
const ORG = "cimenta_org";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30,
};

export type Session = {
  userId: string;
  email: string;
  fullName: string;
  orgId: string;
  orgName: string;
  role: Role;
  memberships: { orgId: string; orgName: string; role: Role }[];
  projectIds: string[];
};

export function canSee(session: Session, projectId: string) {
  return session.role === "admin" || session.projectIds.includes(projectId);
}

export function assertBudget(session: Session) {
  if (session.role !== "admin" && session.role !== "presupuestador") {
    throw new AppError("No tiene permiso para modificar el presupuesto.");
  }
}

export function assertWarehouse(session: Session) {
  if (session.role !== "admin" && session.role !== "bodega") {
    throw new AppError("No tiene permiso para registrar bodega.");
  }
}

export function assertAdmin(session: Session) {
  if (session.role !== "admin") throw new AppError("Solo el administrador puede hacer este cambio.");
}

async function assemble(userId: string, email: string): Promise<Session | null> {
  return transaction(async (tx) => {
    const membershipRows = (await tx.list("organization_members", { user_id: userId })) as Membership[];
    if (!membershipRows.length) return null;
    const orgs = (await tx.list("organizations")) as Organization[];
    const jar = await cookies();
    const preferred = jar.get(ORG)?.value;
    const membership = membershipRows.find((item) => item.org_id === preferred) ?? membershipRows[0];
    const org = orgs.find((item) => item.id === membership.org_id);
    const assigned = (await tx.list("project_members", { user_id: userId, org_id: membership.org_id })) as ProjectMember[];
    const profile = (await tx.list("profiles", { id: userId }))[0] as Profile | undefined;
    return {
      userId,
      email: email || profile?.email || "",
      fullName: profile?.full_name || email,
      orgId: membership.org_id,
      orgName: org?.name ?? "Organización",
      role: membership.role,
      memberships: membershipRows.map((item) => ({
        orgId: item.org_id,
        orgName: orgs.find((orgRow) => orgRow.id === item.org_id)?.name ?? "Organización",
        role: item.role,
      })),
      projectIds: assigned.map((item) => item.project_id),
    };
  });
}

export async function getSession(): Promise<Session | null> {
  if (supabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return assemble(data.user.id, data.user.email ?? "");
  }
  const userId = (await cookies()).get(UID)?.value;
  if (!userId) return null;
  const user = await transaction(async (tx) => (await tx.list("users", { id: userId }))[0] as UserRow | undefined);
  if (!user) return null;
  return assemble(user.id, user.email);
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

async function remember(userId: string, orgId: string) {
  const jar = await cookies();
  if (!supabaseConfigured()) jar.set(UID, userId, cookieOptions);
  jar.set(ORG, orgId, cookieOptions);
}

export async function registerAccount(input: { email: string; password: string; fullName: string; orgName: string; invitation?: string }) {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) throw new AppError("Indique un correo válido.");
  if (input.password.length < 6) throw new AppError("La clave debe tener al menos 6 caracteres.");
  if (supabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: { data: { full_name: input.fullName.trim(), org_name: input.orgName.trim(), invitation: input.invitation ?? "" } },
    });
    if (error) throw new AppError(error.message);
    if (!data.session || !data.user) throw new AppError("Revise su correo para confirmar la cuenta antes de entrar.");
    const session = await assemble(data.user.id, email);
    if (session) await remember(session.userId, session.orgId);
    return;
  }
  await transaction(async (tx) => {
    const existing = await tx.list("users", { email });
    if (existing.length) throw new AppError("Ese correo ya está registrado.");
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    await tx.insert("users", { id: userId, email, full_name: input.fullName.trim(), password_hash: hashPassword(input.password), created_at: now });
    await tx.insert("profiles", { id: userId, email, full_name: input.fullName.trim(), created_at: now });
    let orgId = "";
    let role: Role = "admin";
    if (input.invitation) {
      const invitation = (await tx.list("invitations", { token: input.invitation }))[0];
      if (!invitation || invitation.accepted_at) throw new AppError("La invitación no es válida.");
      orgId = String(invitation.org_id);
      role = invitation.role as Role;
      await tx.update("invitations", String(invitation.id), { accepted_at: now });
    } else {
      if (!input.orgName.trim()) throw new AppError("Indique el nombre de la organización.");
      const org = await tx.insert("organizations", { name: input.orgName.trim(), created_at: now });
      orgId = org.id;
      await seedCatalog(tx, orgId);
    }
    await tx.insert("organization_members", { org_id: orgId, user_id: userId, role });
    await remember(userId, orgId);
  });
}

export async function loginAccount(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  if (supabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password });
    if (error || !data.user) throw new AppError("Correo o clave incorrectos.");
    const session = await assemble(data.user.id, normalized);
    if (!session) throw new AppError("El usuario no pertenece a una organización.");
    await remember(session.userId, session.orgId);
    return;
  }
  const user = await transaction(async (tx) => (await tx.list("users", { email: normalized }))[0] as UserRow | undefined);
  if (!user || !verifyPassword(password, user.password_hash)) throw new AppError("Correo o clave incorrectos.");
  const session = await assemble(user.id, user.email);
  if (!session) throw new AppError("El usuario no pertenece a una organización.");
  await remember(user.id, session.orgId);
}

export async function logoutAccount() {
  const jar = await cookies();
  if (supabaseConfigured()) {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  jar.delete(UID);
  jar.delete(ORG);
}

export async function switchOrganization(orgId: string) {
  const session = await requireSession();
  if (!session.memberships.some((item) => item.orgId === orgId)) throw new AppError("No pertenece a esa organización.");
  (await cookies()).set(ORG, orgId, cookieOptions);
}

export async function listPeople(session: Session) {
  return transaction(async (tx) => {
    const members = (await tx.list("organization_members", { org_id: session.orgId })) as Membership[];
    const profiles = (await tx.list("profiles")) as Profile[];
    const assigned = (await tx.list("project_members", { org_id: session.orgId })) as ProjectMember[];
    return members.map((member) => ({
      ...member,
      email: profiles.find((profile) => profile.id === member.user_id)?.email ?? "",
      fullName: profiles.find((profile) => profile.id === member.user_id)?.full_name ?? "",
      projectIds: assigned.filter((item) => item.user_id === member.user_id).map((item) => item.project_id),
    }));
  });
}

export async function createMember(input: { email: string; password: string; fullName: string; role: Role; projectIds: string[] }) {
  const session = await requireSession();
  assertAdmin(session);
  const email = input.email.trim().toLowerCase();
  if (input.password.length < 6) throw new AppError("La clave debe tener al menos 6 caracteres.");
  const token = crypto.randomUUID();
  const now = new Date().toISOString();
  await transaction(async (tx) => {
    await tx.insert("invitations", { org_id: session.orgId, email, role: input.role, token, created_at: now, accepted_at: null });
  });
  if (supabaseConfigured()) {
    const admin = await createServiceClient();
    if (!admin) return { created: false, token };
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName.trim(), invitation: token },
    });
    if (error || !data.user) throw new AppError(error?.message ?? "No se pudo crear el usuario.");
    await transaction(async (tx) => {
      for (const projectId of input.projectIds) {
        await tx.insert("project_members", { org_id: session.orgId, project_id: projectId, user_id: data.user.id });
      }
    });
    return { created: true, token };
  }
  await transaction(async (tx) => {
    if ((await tx.list("users", { email })).length) throw new AppError("Ese correo ya está registrado.");
    const userId = crypto.randomUUID();
    await tx.insert("users", { id: userId, email, full_name: input.fullName.trim(), password_hash: hashPassword(input.password), created_at: now });
    await tx.insert("profiles", { id: userId, email, full_name: input.fullName.trim(), created_at: now });
    await tx.insert("organization_members", { org_id: session.orgId, user_id: userId, role: input.role });
    const invitation = (await tx.list("invitations", { token }))[0];
    if (invitation) await tx.update("invitations", invitation.id, { accepted_at: now });
    for (const projectId of input.projectIds) {
      await tx.insert("project_members", { org_id: session.orgId, project_id: projectId, user_id: userId });
    }
  });
  return { created: true, token };
}

export async function assignProjects(userId: string, projectIds: string[]) {
  const session = await requireSession();
  assertAdmin(session);
  await transaction(async (tx) => {
    const current = (await tx.list("project_members", { org_id: session.orgId, user_id: userId })) as ProjectMember[];
    for (const row of current) await tx.remove("project_members", row.id);
    for (const projectId of projectIds) {
      await tx.insert("project_members", { org_id: session.orgId, project_id: projectId, user_id: userId });
    }
  });
}

export function text(row: Row | undefined, key: string) {
  return String(row?.[key] ?? "");
}
