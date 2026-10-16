# Ejemplo de uso de Cimenta

Este texto recorre una obra pequeña, de principio a fin, con las pantallas reales del sistema. Los números son de ejemplo. Cimenta calcula el presupuesto, el VAE y el reajuste; no presenta declaraciones ante el SERCOP.

La obra del ejemplo es **Aceras de la calle Sucre**, de la organización **Estudio Río**.

## Quién entra

Hay dos papeles distintos.

El **administrador de plataforma** ve el menú Plataforma. Ahí activa o desactiva organizaciones. Una organización nueva nace inactiva: sus miembros no usan obras ni catálogo hasta que se active. La primera cuenta que se registra, si todavía no hay administrador de plataforma, queda activa y pasa a ser ese administrador.

Dentro de la organización hay cuatro roles:

| Rol | Para qué sirve |
| --- | --- |
| Administrador | Ve todas las obras, crea usuarios y puede eliminar la obra |
| Presupuestador | Arma presupuesto, indirectos, reajuste y cronograma de las obras que le asignen |
| Bodega | Registra ingresos y salidas de materiales |
| Consulta | Solo lee |

El administrador de la organización ve todas las obras. Los demás solo ven las que tienen asignadas.

## 1. Crear la cuenta

1. Abra **Crear organización** desde el ingreso.
2. Escriba nombre, correo, clave (mínimo 6 caracteres) y el nombre de la organización: `Estudio Río`.
3. Pulse **Crear cuenta**. El botón pasa a **Creando cuenta…** mientras entra.
4. Si la organización queda inactiva, la pantalla **Organización inactiva** lo indica. El administrador de plataforma entra a **Plataforma** y pulsa **Activar**. Después se vuelve a ingresar con el mismo correo.

El ícono de sol o luna, arriba a la derecha, cambia entre modo claro y oscuro.

## 2. Armar la base de precios

La base pertenece a la organización y sirve para todas las obras. Un registro que ya está en uso no se elimina.

En el menú, abra **Mantenimiento**. Cada catálogo es una pantalla: la lista, **Agregar** y **Editar** están separados.

Para este ejemplo basta con esto:

1. **Unidades.** Agregue `m2` (metro cuadrado) y `h` (hora), si no existen.
2. **Capítulos.** Agregue `01` Obras preliminares.
3. **Materiales.** Agregue `Hormigón simple`, unidad `m3`, con precio de cámara y precio personal.
4. **Mano de obra.** Agregue `Albañil`, con salario hora de cámara y salario hora personal.
5. **CPC.** Si va a calcular VAE, cargue el código de 9 dígitos del insumo.

**Recalcular obras** copia esos precios a las obras que ya usan esa familia. **Históricos** guarda una foto de precios con una nota, por ejemplo `precios de octubre`, para usarla después en el presupuesto.

## 3. Crear la obra

En **Obras**:

1. En **Nueva obra**, escriba `Aceras de la calle Sucre` y la fecha propuesta.
2. Pulse **Crear obra**.
3. En el listado, pulse **Abrir**.

También puede traer el presupuesto con **Presupuesto desde Excel**: descargue la plantilla, llene el archivo y pulse **Importar**. El nombre del archivo cabe dentro de la tarjeta; si es largo, se corta con puntos suspensivos.

## 4. Datos de la obra

Arriba de la obra están las secciones: Datos, Presupuesto, Indirectos, Desagregación, Reajuste, Cronograma, Bodega, Planillas y Reportes.

En **Datos** complete, por grupos:

- Identificación: proponente, propietario, quién calcula y quién revisa.
- Ubicación y plazo: provincia, cantón, parroquia, dirección e inicio de obra.
- Precio: rendimiento (por rubro o por insumo), herramienta menor, transporte, esquema de precio (cámara o personal), porcentaje de indirectos y umbral VAE.

Pulse **Guardar datos**. Si cambia el porcentaje de indirectos, el presupuesto se recalcula con ese porcentaje. El enlace **Obras**, arriba, vuelve al listado.

## 5. Presupuesto y análisis de precios

En **Presupuesto**:

1. Cree el capítulo `Aceras`.
2. Agregue el rubro. Puede tomarlo del catálogo o crearlo en blanco. Ejemplo: `01.001` Aceras de hormigón, unidad `m2`, cantidad `120` (el volumen de obra).
3. Abra el rubro. En el APU agregue los insumos:
   - material: hormigón, con cantidad y precio;
   - mano de obra: albañil, con el rendimiento (unidad de obra por hora; las horas son 1 dividido para el rendimiento).
4. Pulse **Guardar rubro** y **Agregar insumo**.

El auxiliar entra como material de otro rubro, un solo nivel, y no se suma otra vez al total de la oferta. Un subcontrato puede usar el valor propuesto en lugar del análisis.

La pantalla muestra costo directo, indirecto, precio unitario y total. **Subir** y **Bajar** ordenan los rubros.

En **Actualizar insumos** elija una sola operación y pulse **Aplicar operación**:

- actualizar precios desde mantenimiento, precios personales o un histórico;
- incrementar un porcentaje;
- reemplazar un insumo;
- traer capítulos de otra obra.

## 6. Indirectos

En **Indirectos** cada concepto muestra solo los campos de su forma de cálculo: costo mensual por meses, un total fijo, un porcentaje o anticipo, prima y garantías.

1. Agregue, por ejemplo, `Residente de obra`.
2. Elija el cálculo, complete los campos que aparecen y pulse **Guardar concepto**.
3. Si el desglose no coincide con el porcentaje general de la obra, elija **Dejar el porcentaje general** o **Adoptar este desglose**.

## 7. Desagregación y VAE

En **Desagregación tecnológica** asigne a cada insumo:

- origen: **EP** cuenta 100 %, **ND** 40 % y **NP** 0 %;
- CPC de 9 dígitos.

Guarde cada fila. Cimenta muestra el VAE de la obra y si alcanza el umbral cargado en los datos. El sistema calcula y reporta; no declara el VAE.

## 8. Reajuste

En **Reajuste** los coeficientes de la fórmula deben sumar 1. Para cada símbolo escriba coeficiente, índice base e índice del período, y pulse **Guardar**.

La cuadrilla tipo sale de la mano de obra del presupuesto. Abajo puede redactar el informe técnico.

## 9. Cronograma

En **Cronograma**:

1. En el calendario, escriba las horas de lunes a domingo y la fecha de inicio. Pulse **Guardar calendario**.
2. En el Gantt, ajuste grupo, inicio, días y responsable de cada rubro. La escala (día, semana, mes, trimestre o año) solo cambia la lectura.
3. En el cronograma valorado, genere los períodos y reparta el porcentaje de cada rubro hasta cerrar en 100 %.

## 10. Bodega y planillas

Cuando la obra ya se ejecuta:

En **Bodega**, **Registrar movimiento** anota un ingreso contra el análisis o una salida al rubro. La tabla de arriba compara lo presupuestado con ingresos, salidas y saldo. Este registro lo hace el rol Bodega o el administrador.

En **Planillas**:

1. Registre el anticipo, con fecha y nota.
2. Si hace falta, registre un deducible: valor fijo en USD o porcentaje del avance.
3. Cree la planilla del período y escriba la cantidad ejecutada de cada rubro.
4. Indique la amortización del anticipo.

La pantalla muestra avance, reajuste del período, amortización, deducibles y el valor a pagar. Si la fórmula polinómica no suma uno, el reajuste de esa planilla queda en cero hasta corregir los coeficientes.

## 11. Reportes

En **Reportes** elija la salida: presupuesto general, numerado, detallado, costos directos, capítulos, insumos, análisis de precios unitarios, indirectos, desagregación, fórmula, bodega, planillas o cronograma.

Cada una se abre para revisar, o se descarga en Excel o Word. También están el respaldo JSON de la obra, el respaldo de la organización y la exportación del cronograma a Project.

## 12. Dar acceso al equipo

El administrador abre **Usuarios**.

1. En **Alta**, escriba nombre, correo, clave inicial y rol.
2. Marque las obras que esa persona puede ver. El administrador no necesita marca: ve todas.
3. Pulse **Crear usuario**.

Esa persona entra con el correo y la clave inicial, y solo encuentra las obras asignadas.

## Recorrido corto del ejemplo

1. Activar Estudio Río, si nació inactiva.
2. Cargar unidad `m2`, un capítulo, un material y un albañil.
3. Crear **Aceras de la calle Sucre**.
4. Poner datos, indirectos y umbral VAE.
5. Presupuestar 120 m2 de acera, con hormigón y albañil.
6. Marcar origen y CPC, y cerrar la fórmula en 1.
7. Calendario, Gantt y porcentajes del cronograma en 100 %.
8. Cuando haya ejecución: ingreso de bodega, anticipo y la primera planilla.
9. Abrir **Reportes** y descargar el presupuesto general.
