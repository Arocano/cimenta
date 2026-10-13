# ARESplus

ARESplus es el software de costos para construcción de [TetraSistemas](https://arespreciosunitarios.com/). Sirve para elaborar presupuestos, análisis de precios unitarios (APU), cronogramas, reajustes, desagregación tecnológica y control de materiales de una obra.

En Ecuador se usa para armar la información económica de la contratación pública de obras: presupuesto referencial u oferta, códigos CPC, Valor Agregado Ecuatoriano (VAE), fórmula de reajuste, cronograma valorado y planillas. El trámite del procedimiento (publicación, preguntas, ofertas y adjudicación) se hace en el portal del Servicio Nacional de Contratación Pública (SERCOP). ARESplus prepara y controla la parte técnica de costos y tiempo.

Sitio oficial: [https://arespreciosunitarios.com/](https://arespreciosunitarios.com/)

Este repositorio documenta el producto. No contiene el código de ARESplus.

La ficha pública de 2026 indica una base de **10.000 rubros** (civil, sanitaria, eléctrica, mecánica y electrónica), interfaz en español e intercambio con Excel, Word y Project. TetraSistemas lleva 27 años en el sector y declara más de 12.000 clientes en el país, entre municipios, instituciones y profesionales. El sitio anuncia que ARESplus pasará a llamarse **ARES 360**.

Los nombres de pantallas, formatos institucionales, compatibilidad de archivos y el alcance exacto de cada licencia dependen de la versión instalada. El propio sitio pide validar esos datos con la versión comercial vigente.

---

## Cómo se organiza una obra dentro del sistema

Una obra se arma en este orden. Las opciones de reajuste y cronograma se habilitan cuando el proyecto ya existe.

1. **Proyecto.** Datos generales, formato de presentación, porcentaje de indirectos y reglas de cálculo.
2. **Capítulos.** Agrupan los rubros (movimiento de tierras, estructura, instalaciones, etc.).
3. **Rubros.** Cada actividad, con unidad, cantidad (volumen de obra) y rendimiento.
4. **Insumos del APU.** Materiales, mano de obra, equipos y transporte que componen el precio del rubro.
5. **Precio.** Costo directo, costos indirectos y precio unitario. El presupuesto es la suma de precio unitario por cantidad.
6. **Documentos del procedimiento.** Desagregación CPC/VAE, fórmula de reajuste, cuadrilla tipo y cronograma.
7. **Ejecución.** Planillas, anticipo, deducibles, bodega y comparación entre lo presupuestado y lo real.

Menú histórico del producto, vigente como mapa funcional:

| Menú | Para qué sirve |
| --- | --- |
| Proyecto | Crear, abrir, copiar, importar, exportar, actualizar precios, indirectos, usuarios |
| Mantenimiento | Catálogos de capítulos, rubros, insumos, unidades, proveedores y precios |
| Reajuste | Símbolos, fórmula polinómica y cuadrilla tipo |
| Cronograma | Grupos, Gantt, cronograma valorado, calendario laboral |
| Reportes | Presupuesto, APU, insumos, indirectos, reajuste y gráficos |
| Ayuda | Ayuda de pantalla y de campo |

---

## Funciones

### 1. Proyecto

| Función | Qué hace |
| --- | --- |
| Nuevo proyecto | Crea la obra. El nombre es obligatorio. La fecha propuesta es la del día y se edita en formato día/mes/año. |
| Datos generales | Proponente, propietario, calculado por, revisado por, descripción, provincia, cantón, parroquia, sector y dirección. |
| Formato de presentación | Define las columnas del análisis y de la oferta. El rendimiento puede ir por rubro o por cada insumo de mano de obra y equipo. |
| Herramienta menor | Porcentaje global de la mano de obra, o un porcentaje distinto en cada rubro. |
| Transporte por defecto | Al crear la obra, materiales y equipos pueden entrar o quedar fuera del transporte. |
| Abrir proyecto | Lista las obras por nombre y fecha. Solo hay una obra abierta a la vez. |
| Copiar proyecto | Duplica una obra para reutilizar un análisis parecido. |
| Propiedades | Consulta y modifica los datos generales y el porcentaje de indirectos. La ventana de presupuesto debe estar cerrada para cambiar indirectos. |
| Exportar | Lleva la obra abierta, o todas las obras, a otra computadora o a un respaldo. Puede exportar solo los rubros de la obra o la base completa. |
| Importar ARES | Recupera una exportación del propio sistema. |
| Importar APU | Trae archivos del programa Análisis de Precios Unitarios 95. Ese origen usa punto como separador decimal. |
| Base externa | Importa obras de otra instalación de ARES, incluso en red. |
| Opciones de importación | Incluir los rubros en el listado general, dejarlos solo dentro de la obra, o no mostrarlos en la lista general. Puede importar todas las carpetas de un directorio. |
| Presupuestos desde Excel | Sube un presupuesto ya armado en Excel, con el formato que exige la plantilla del sistema. |
| ARESplusMacro | Convierte rubros de Excel al formato con el que se sigue trabajando dentro de ARESplus. |
| Importar desde varias obras | Toma capítulos, rubros e insumos de otros proyectos. |
| Crear históricos | Guarda una foto de materiales, transporte, mano de obra y equipos en una fecha, para consultar precios anteriores. |
| Actualización de precios de cámara | Carga el archivo de precios actualizados (históricamente `Datos.xls`, con precios de cámaras de la construcción) y elige qué familias de insumos actualizar. |
| Actualizar el presupuesto abierto | Reescribe los precios de la obra abierta desde mantenimiento (precios actuales), históricos o precios personales. |
| Dos esquemas de precio | Cada insumo puede tener precio de cámara y precio personal. |
| Aportantes | Si se activa en el proyecto, permite registrar empresas que aportan un porcentaje del costo sobre equipo, mano de obra, material y transporte. |
| Usuarios y permisos | Alta, clave y acceso por obra. El administrador asigna las obras de cada usuario. Se puede cambiar de usuario sin salir del programa. |
| Respaldo y recuperación | Recuperación ante fallas y respaldo de históricos de precios. |
| Validación y ayuda | Validación al ingresar datos y ayuda a nivel de pantalla y de campo. |

### 2. Presupuesto y análisis de precios unitarios

La ventana de datos del presupuesto es el centro del trabajo. El orden de carga es capítulo, rubro e insumos.

**Capítulos**

- Alta, edición y reordenamiento.
- El orden se cambia con el capítulo seleccionado y las teclas de desplazamiento.
- Total del capítulo y total del presupuesto.

**Rubros**

- Código opcional, nombre, unidad y tipo.
- Volumen de obra (cantidad), entero o decimal.
- Rendimiento del rubro en unidad por hora. En los formatos que lo piden, el insumo lleva horas por unidad (`k = 1 / R`).
- Subcontratos: el rubro toma un valor propuesto y deja de usar su análisis.
- Rubros auxiliares: hormigones, morteros, módulos y encofrados se usan como material de otro rubro. El sistema abre un capítulo Auxiliares. El auxiliar se edita ahí y ese cambio llega al rubro que lo contiene. Hay un solo nivel de auxiliar.
- Copia de rubros, capítulos e insumos.
- Buscador por las primeras letras o por palabras contenidas.
- Precio APU automático: el costo de equipo y mano de obra sale de los rendimientos, y con eso se obtiene el costo del rubro.

**Insumos del rubro**

| Componente | Qué registra |
| --- | --- |
| Materiales | Insumo, unidad, precio y cantidad o rendimiento por unidad de rubro. |
| Mano de obra | Categoría salarial, rendimiento y normativa laboral usada en la base. |
| Equipos y maquinaria | Costo hora-equipo, rendimiento, amortización y, en el catálogo, potencia, marca, tipo y combustible. |
| Transporte | Flete y distancias de acarreo. |

Por cada rubro la ventana muestra:

- Subtotal de equipo, mano de obra, material y transporte.
- Costo directo, costo indirecto y precio unitario.
- Total del rubro (precio unitario por cantidad).
- Total del capítulo y total del presupuesto.

También se puede incrementar un porcentaje al valor de los insumos y buscar o reemplazar un insumo por código o por nombre.

### 3. Catálogos de mantenimiento

Estos catálogos pertenecen a la base y quedan disponibles para todas las obras. Un registro en uso no se elimina.

| Catálogo | Contenido |
| --- | --- |
| Equivalencias | Conversión de unidades. Ejemplo: 100 m = 1 km. |
| Capítulos | Lista general de capítulos. |
| Rubros | Código, nombre y unidad. |
| Tipos y rubro por tipo | Clasificación de rubros y su asociación. |
| Equipos | Código, nombre, costo por hora, rendimiento, potencia, marca, tipo, uso de gasolina y código de cámara. |
| Ciudades | Centros donde se registran proveedores. |
| Proveedores | Nombre y dirección, asociados a una ciudad. |
| Materiales | Código, descripción, unidad y precio. Relación material–proveedor. |
| Mano de obra y categorías | Salarios y categorías. |
| Transporte | Tarifas de transporte. |
| Análisis de rubros | Vista de cada rubro de la base con equipo, mano de obra, material, transporte, formato y costo directo. |
| Históricos | Precios vigentes en una fecha guardada. |
| Eliminar información | Borrado selectivo de la base. Elegir todas las opciones la deja en blanco. |

En estas ventanas se agrega un registro en una fila nueva, se elimina con confirmación y se busca dentro del catálogo. Al cerrar, el sistema pide confirmación para grabar.

Desde el catálogo de equipos se pueden recalcular los precios de los rubros con el esquema de cámara o con el personal.

### 4. Costos indirectos

El porcentaje puede escribirse directo en el proyecto o calcularse en un desglose. Cada concepto se puede renombrar, apagar o completar con conceptos nuevos. Si el desglose no coincide con el porcentaje general, el sistema pregunta cuál de los dos debe quedar.

Estructura publicada por ARESplus:

| Concepto | Cómo se calcula |
| --- | --- |
| Operaciones de oficina central | Costo por mes multiplicado por los meses, o un total directo. Puede usarse un valor referencial sin detallar cada ítem. |
| Operaciones de obra | La misma lógica de costo mensual por tiempo. |
| Costos varios | La misma lógica de costo mensual por tiempo. |
| Costos impositivos | Un porcentaje aplicado sobre el contrato, sobre el reajuste o sobre el capital de operación. |
| Costos financieros | Calculados con los porcentajes de anticipo, prima y garantías. |
| Imprevistos y utilidad | Porcentaje sobre el subtotal que reúne el costo directo y los costos de operación. |

El reporte de costos indirectos sale junto con el presupuesto.

### 5. Desagregación tecnológica, CPC y VAE

Esta función prepara el estudio que la normativa secundaria del SERCOP exige en la contratación de obras. ARESplus trae la base de umbrales del VAE definidos por el SERCOP y la aplica dentro del presupuesto.

- Asigna **código CPC nivel 9** (nueve dígitos) a los componentes del análisis.
- Identifica cada insumo como **EP**, **NP** o **ND**.
- Genera reportes de presupuesto y de análisis con la desagregación tecnológica.
- Permite revisar si la obra cumple el umbral de VAE del procedimiento.

En el uso del sector esas siglas se leen así:

| Sigla | Lectura habitual | Participación ecuatoriana que suele asignarse |
| --- | --- | --- |
| EP | Enteramente producido en el país | 100 % |
| ND | No definido | 40 % |
| NP | No producido en el país | 0 % |

Esos porcentajes son el criterio de trabajo difundido en la práctica de desagregación. El estudio de una obra concreta debe seguir el anexo metodológico vigente del SERCOP para desagregación tecnológica de obras y los umbrales cargados en la versión del programa. La entidad contratante y el oferente declaran el VAE del procedimiento; ARESplus organiza el cálculo y los reportes, no reemplaza esa declaración ni el portal de compras públicas.

### 6. Reajuste de precios

El reajuste reconoce la variación de costos de los insumos durante la ejecución. ARESplus arma la información de la fórmula a partir del presupuesto.

| Función | Qué hace |
| --- | --- |
| Símbolos | Agrupa materiales, mano de obra y equipo. En el equipo separa sus componentes de costo y deja un ítem de herramienta menor. Calcula el peso de cada grupo sobre el costo directo. |
| Fórmula polinómica | Arma la fórmula con coeficientes que suman uno. Cada coeficiente multiplica la relación entre el índice del período y el índice base del grupo. |
| Cuadrilla tipo | Presenta el peso de cada categoría de mano de obra. Se calcula por categoría o por mano de obra. |
| Informe técnico | Deja constancia de los datos del informe asociado al reajuste. |

La fórmula se aplica al anticipo y a las planillas: el valor reajustado es el valor inicial multiplicado por la suma de cada coeficiente por la variación de su índice. Los índices y la metodología aplicable son los de la resolución y la fórmula contractual vigentes, no un juego fijo de porcentajes.

Reportes de este módulo: símbolos, fórmula y cuadrilla.

### 7. Programación

La fecha de inicio de la obra se ingresa en el cronograma y desde ahí manda a los demás diagramas.

| Función | Qué hace |
| --- | --- |
| Grupos | Agrupa los rubros por capítulo. Si se desactiva esa opción, el grupo se renombra y se rearma a mano. |
| Calendario laboral | Trae un calendario estándar de 8 horas, de lunes a viernes. Se pueden crear calendarios con jornada por día. El calendario elegido altera la duración. |
| Diagrama de Gantt | En cada rubro se editan fecha inicial, duración en días y responsable. La escala se ve por años, trimestres, meses, semanas o días. |
| Exportar a Microsoft Project | Pasa los datos a Project si ese programa está instalado. Lo que se grabe después en Project ya no vuelve a ARESplus. |
| Cronograma valorado | Reparte el precio de cada rubro en períodos. La escala es la duración en días de cada período. Un doble clic puede cargar el 100 % entre el inicio y el fin del rubro. También se agregan subperíodos con fecha de inicio, fin y porcentaje. |
| Curvas de inversión | Grafica la inversión por período y la inversión acumulada. |
| Cronograma por componente | Consulta, sin edición, los elementos y el grupo o rubro al que pertenecen. |

### 8. Control de obra, bodega y planillas

| Función | Qué hace |
| --- | --- |
| Ingreso de materiales | Registra lo que entra, contrastado con el análisis del presupuesto. |
| Salida de materiales | Registra lo que sale, asociado al rubro real de obra. |
| Bodega | Reporta por material, rubro, factura y proveedor, en un rango de fechas, con cantidad, precio y total. |
| Materiales a costo real | Planilla de salidas reales comparada con lo presupuestado. |
| Planillas | Genera las planillas de avance de la obra. |
| Anticipos y deducibles | Registra el anticipo y los descuentos que se aplican en la liquidación. |

### 9. Reportes y salidas

| Reporte | Contenido |
| --- | --- |
| Presupuesto general | Unidad, cantidad, precio unitario y precio total, agrupado por capítulos. |
| Presupuesto numerado | El mismo presupuesto con numeración automática de rubros. |
| Presupuesto detallado | Agrega materiales, mano de obra, equipo y transporte. |
| Costos directos | El detalle por unidad de rubro. |
| Solo capítulos | Totales de capítulo, sin rubros. |
| Listado de insumos | Equipo, mano de obra, material o transporte de una obra, también repartidos por capítulo y rubro. |
| Análisis de precios unitarios | Hoja de análisis de todos los rubros, o de un capítulo y un rubro. |
| Costos indirectos | Desglose del porcentaje indirecto. |
| Rubros | Listado de rubros. |
| Históricos | Precios de una fecha guardada, por familia de insumo. |
| Mantenimiento | Precios actuales de la base. |
| Gráfico comparativo | Comparación gráfica de valores del proyecto. |
| Símbolos, fórmula y cuadrilla | Respaldo del reajuste. |
| Desagregación tecnológica | Presupuesto y análisis con CPC y VAE. |
| Bodega y materiales reales | Movimientos y comparación contra el presupuesto. |
| Cronogramas | Gantt, valorado y curvas, según la salida disponible en la versión. |

Las salidas documentadas son PDF, Excel y Word, además de la exportación del cronograma a Project.

El manual clásico del producto incluye formatos de presentación usados por instituciones (Contraloría, municipios, empresas públicas y otros). Esos formatos cambian con la versión; hay que confirmar en el programa instalado cuáles siguen disponibles.

---

## Procesos de trabajo

### Proceso 1. Crear el presupuesto

1. Activar la licencia e ingresar con usuario y clave.
2. Crear el proyecto y completar proponente, ubicación, fecha y formato.
3. Definir si la herramienta menor es un porcentaje global o por rubro, y si materiales y equipos llevan transporte.
4. Elegir precio de cámara o precio personal.
5. Crear capítulos.
6. Agregar rubros desde la base o crearlos. Ordenarlos como irá la oferta.
7. Cargar el volumen de obra y el rendimiento de cada rubro.
8. Armar el APU: materiales, mano de obra, equipos y transporte.
9. Marcar subcontratos con su valor propuesto y convertir en auxiliares los rubros que se consumen dentro de otros.
10. Revisar costo directo, indirecto y precio unitario.
11. Calcular o escribir los costos indirectos y aceptar el porcentaje resultante.
12. Actualizar insumos desactualizados por código o por nombre.
13. Emitir presupuesto, análisis y listado de insumos.

### Proceso 2. Reutilizar una obra o una base

1. Copiar un proyecto parecido, o importar capítulos y rubros desde otras obras.
2. Traer un Excel con ARESplusMacro o con la carga de presupuestos, respetando la plantilla.
3. Decidir si los rubros importados entran a la lista general.
4. Ajustar cantidades, rendimientos y precios personales.
5. Exportar la obra, o todas las obras, como respaldo antes de compartirla.

### Proceso 3. Dejar la oferta lista para un procedimiento de obra

Este es el proceso que usa la contratista o la entidad cuando el presupuesto va a contratación pública.

1. Cerrar cantidades, precios e indirectos del presupuesto referencial o de la oferta.
2. Asignar CPC nivel 9 a los insumos y revisar la identificación EP, NP y ND.
3. Generar el reporte de desagregación y comparar el VAE resultante con el umbral del procedimiento.
4. Corregir origen o composición de insumos si el VAE no alcanza el umbral exigido.
5. Generar símbolos, fórmula polinómica y cuadrilla tipo.
6. Definir la fecha de inicio, el calendario laboral y la duración de cada rubro.
7. Armar el Gantt y el cronograma valorado. Revisar la curva de inversión: el valor programado debe cerrar con el presupuesto.
8. Exportar a Excel, Word o PDF los juegos que pidan los pliegos: presupuesto, APU, insumos, cronograma, fórmula y desagregación.
9. Si el cronograma se va a desarrollar en Project, exportarlo en este punto. Los cambios posteriores en Project no regresan solos a ARESplus.

La publicación de pliegos, la presentación de la oferta y la adjudicación se hacen en las herramientas del SERCOP. ARESplus entrega los anexos económicos y técnicos.

### Proceso 4. Controlar la ejecución

1. Registrar el anticipo y los deducibles del contrato.
2. Registrar ingresos de materiales contra el análisis presupuestado.
3. Registrar salidas contra el rubro realmente ejecutado.
4. Consultar bodega por material, rubro, factura, proveedor y fechas.
5. Comparar la planilla de materiales a costo real con el valor presupuestado.
6. Elaborar la planilla de avance.
7. Aplicar la fórmula de reajuste del período, con los índices correspondientes a cada símbolo, sobre el anticipo o sobre la planilla.
8. Emitir los reportes de planilla, bodega y reajuste para fiscalización y pago.

### Proceso 5. Mantener la base técnica

1. Pedir o cargar la actualización de precios cuando cambie la base de la cámara o la base entregada por TetraSistemas.
2. Elegir qué familias actualizar: materiales, mano de obra, equipos o transporte.
3. Guardar un histórico antes de una actualización grande, para poder volver a precios de una fecha.
4. Corregir equivalencias de unidades cuando un insumo llegue en otra unidad.
5. Crear usuarios por responsable y limitar cada uno a sus obras.
6. Exportar la base o los proyectos como respaldo.

---

## ARESplus dentro de la contratación pública de obras

La Ley Orgánica del Sistema Nacional de Contratación Pública y la normativa secundaria del SERCOP regulan el procedimiento. ARESplus cubre el expediente económico de la obra, en las dos orillas del contrato.

**Entidad contratante**

- Arma el presupuesto referencial por capítulos, rubros y APU.
- Calcula indirectos, fórmula de reajuste y cronograma valorado de referencia.
- Prepara el estudio de desagregación tecnológica: CPC nivel 9, VAE y umbral del procedimiento.
- Entrega reportes homogéneos a fiscalización, presupuesto y compras públicas.
- Durante la obra, contrasta planillas, reajustes y materiales con lo contratado.

**Oferente y contratista**

- Importa o rearma el presupuesto de la oferta.
- Ajusta rendimientos, precios personales y transporte a su forma de ejecutar.
- Comprueba el VAE de su oferta contra el umbral publicado.
- Presenta cronograma valorado, curva de inversión y fórmula.
- En ejecución, controla bodega, planillas, anticipo, deducibles y reajuste.

**Consultor, fiscalizador y academia**

- Revisa que cada rubro tenga unidad, cantidad, rendimiento y cuatro componentes.
- Compara versiones de una misma obra con la copia de proyectos y los históricos.
- Usa el programa en capacitación de presupuestos, compras públicas y ofertas.

Capacitaciones que el sitio describe, en un programa de referencia de 17 horas:

| Duración | Tema |
| --- | --- |
| 8 h | ARESplus, presupuestos y APU |
| 5 h | Compras públicas y organización de la información técnica |
| 4 h | Elaboración práctica de ofertas |

Hay además capacitación a medida para empresas, entidades y universidades.

---

## Licencias

El sitio describe tres caminos. Precios, impuestos, vigencia y condiciones se publican solo cuando están aprobados.

| Plan | A quién va | Qué incluye |
| --- | --- | --- |
| ARESplus Profesional | Profesionales independientes | Licencia según condiciones vigentes, activación, instalación y el soporte definido |
| ARESplus + Capacitación | Quien necesita criterio técnico además de la herramienta | Licencia, formación en software y APU, contenidos según la edición |
| Plan Institucional | Empresas, entidades y universidades | Licencias por equipo, capacitación personalizada, implementación y soporte acordado |

---

## Glosario

| Término | Significado |
| --- | --- |
| APU | Análisis de precios unitarios. Desglose de un rubro en materiales, mano de obra, equipos y transporte. |
| Rubro | Actividad de obra con unidad de medida y precio unitario. |
| Capítulo | Grupo de rubros. |
| Costo directo | Suma de los insumos del rubro, sin indirectos. |
| Precio unitario | Costo directo más la incidencia de los costos indirectos. |
| Rendimiento | Producción por hora. Su inverso son las horas necesarias por unidad. |
| Rubro auxiliar | Rubro analizado que entra como material de otro rubro. |
| CPC | Clasificador de productos. En contratación pública se usa a nivel 9, de nueve dígitos. |
| VAE | Valor Agregado Ecuatoriano. Mide la participación nacional del objeto contratado. |
| EP / NP / ND | Clasificación del insumo frente al VAE: enteramente producido, no producido o no definido. |
| Umbral VAE | Porcentaje mínimo de valor agregado ecuatoriano que el SERCOP fija para el procedimiento. |
| Fórmula polinómica | Expresión del reajuste: cada grupo de costos tiene un coeficiente y un índice. |
| Cuadrilla tipo | Mezcla ponderada de categorías de mano de obra, usada en el reajuste. |
| Cronograma valorado | Programa de obra expresado en dinero por período. |
| Planilla | Valuación del avance ejecutado para el pago. |
| SERCOP | Servicio Nacional de Contratación Pública. |
| SOCE / portal de compras públicas | Plataforma donde la entidad publica el procedimiento y el oferente presenta la oferta. ARESplus no sustituye ese portal. |

---

## Fuentes

- [arespreciosunitarios.com](https://arespreciosunitarios.com/): presentación del producto, flujo de cinco pasos y uso en contratación pública.
- [ARESplus](https://arespreciosunitarios.com/aresplus/): alcance, base 2026, CPC, VAE, ARESplusMacro, usuarios y respaldo.
- [Funcionalidades](https://arespreciosunitarios.com/funcionalidades/): presupuesto, indirectos, desagregación, reajuste, Gantt, valorado, bodega, planillas y reportes.
- [Soporte](https://arespreciosunitarios.com/soporte/): instalación, precio APU automático, cronogramas, simbología y licencias.
- [Recursos](https://arespreciosunitarios.com/recursos/), [Capacitaciones](https://arespreciosunitarios.com/capacitaciones/), [Licencias](https://arespreciosunitarios.com/licencias/), [Nosotros](https://arespreciosunitarios.com/nosotros/) y [Contacto](https://arespreciosunitarios.com/contacto/).
- Manual de usuario ARES de TetraSistemas: procesos de proyecto, presupuesto, catálogos, indirectos, reajuste, cronograma y reportes que ARESplus continúa.
- Metodología de desagregación tecnológica de obras del SERCOP (normativa secundaria, anexo del artículo correspondiente a estudios de desagregación en obras). Cualquier umbral o porcentaje de VAE se confirma en la resolución vigente y en los pliegos del procedimiento.

TetraSistemas, creadora de ARES / ARESplus, está en Loja, Ecuador. Contacto publicado en el sitio: [gerencia@arespreciosunitarios.com](mailto:gerencia@arespreciosunitarios.com), WhatsApp 099 425 1568 y teléfono (02) 263 6287.
