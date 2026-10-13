# Cimenta

Cimenta es el sistema de costos de obra para ingeniería civil de este repositorio: presupuesto, análisis de precios unitarios (APU), indirectos, desagregación CPC/VAE, reajuste, cronograma, bodega y planillas.

El nombre del producto es Cimenta. No renombrar la aplicación, el paquete ni la interfaz a ARESplus, ARES o ARES 360. `README.md` describe el dominio de referencia; no es la marca.

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS y shadcn/ui.
- Supabase: Auth, Postgres, RLS y Storage.
- Motor de cálculo en `src/lib/engine` con `decimal.js`. Las pantallas no reimplementan fórmulas.
- Montos en Postgres como `numeric`, nunca como float.
- Python solo si un proceso no cabe en Next.js. Hoy no hace falta.

## Dominio

- Interfaz en español de Ecuador: fechas día/mes/año, moneda USD, locale `es-EC`.
- Multi-organización. Cada empresa tiene su base de precios y sus obras.
- Roles: `admin`, `presupuestador`, `bodega`, `consulta`. El admin ve todas las obras; el resto solo las asignadas en `project_members`.
- Un registro de catálogo en uso no se elimina.
- Un rubro auxiliar entra como material de otro rubro, un solo nivel.
- Los coeficientes de la fórmula polinómica suman 1.
- VAE de trabajo: EP 100 %, ND 40 %, NP 0 %. Cimenta calcula y reporta; no declara ante el SERCOP.
- Cada obra es una ruta. Cambiar el porcentaje de indirectos recalcula y pide confirmación.
