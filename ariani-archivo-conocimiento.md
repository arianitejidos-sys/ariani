# Ariani — Archivo de Conocimiento del Proyecto

> Última actualización: definido en sesión de trabajo, 25 ago 2026.
> Este documento distingue tres tipos de decisión: **[NEGOCIO]** = decidida explícitamente por el dueño del proyecto, **[TÉCNICA]** = decidida por default técnico ante falta de insumo, **[PENDIENTE]** = fuera de alcance del MVP, deliberadamente no resuelta ahora.

---

## 1. Qué es el proyecto

Plataforma web para **Ariani**, marca de productos tejidos a mano de Ana (prendas: blusas, trajes de baño; accesorios: bolsos, pulseras; catálogo adicional de productos para mascotas). El sitio unifica tres flujos de negocio que hoy probablemente conviven de forma informal (WhatsApp/Instagram):

1. **Catálogo fijo con inventario** — productos ya hechos, listos para vender.
2. **Catálogo de mascotas** — misma lógica que el catálogo fijo, categoría separada solo a nivel de presentación/filtrado, no de arquitectura.
3. **Pedidos personalizados** — el cliente envía foto de referencia + descripción, Ana cotiza y confirma viabilidad antes de que el pedido avance.

**[NEGOCIO]** Se validó que los tres flujos comparten el mismo patrón de ciclo de vida (ver sección 4), no son sistemas independientes.

---

## 2. Modelo de negocio — decisiones clave

### 2.1 Envíos
- **[NEGOCIO]** El costo de envío **no es fijo por zona**: depende de la distancia y lo calcula/confirma Ana, no el sistema, ni siquiera en el catálogo fijo.
- **[NEGOCIO]** Esto unifica el flujo: catálogo fijo y personalizado usan el **mismo patrón** → reserva/solicitud → Ana cotiza envío → cliente acepta (vía token/link, ej. correo) → cliente paga.
- **[NEGOCIO]** Cobertura de envío: **solo departamento del Atlántico**, por ahora. El sistema debe restringir explícitamente el checkout/pedido a esta zona (no es un "default", es una regla dura del MVP).
- **[NEGOCIO]** Timeout de cotización: si el cliente no responde a la cotización de envío enviada por Ana, el pedido **se cancela automáticamente a los 2 días**. Requiere job/proceso programado, no puede ser manual.

### 2.2 Pedidos personalizados
- **[NEGOCIO]** El cliente sube foto(s) de referencia + descripción libre. Ana revisa y decide viabilidad antes de que el pedido avance (no hay aceptación automática).
- **[NEGOCIO]** Riesgo identificado y aceptado como parte del modelo: uso de fotos de terceros como referencia de diseño es una zona gris legal/reputacional que recae sobre Ana, no sobre el sistema — el sistema no valida derechos de autor de las imágenes subidas.
- **[NEGOCIO]** Retención de imágenes de referencia: se conservan hasta **7 días después del estado "entregado"**, no se borran al momento de "finalizado". Esto da a Ana una ventana de respaldo ante reclamos o disputas de pago antes del borrado automático. Requiere campo `retention_until` calculado desde `delivered_at` + job de limpieza.

### 2.3 Descuentos y cupones
- **[PENDIENTE]** Ana maneja descuentos y cupones en su operación actual, pero **el mecanismo no fue definido** (¿código manual, porcentaje, por producto, por cliente frecuente?). **Queda explícitamente fuera del MVP**. No implementar campos ni lógica de descuento en el modelo `Order` hasta que esto se defina; si se agrega "a medias" ahora, genera deuda técnica innecesaria.

### 2.4 Ciclo de vida del pedido (unificado)
Los tres tipos de pedido (`catalog`, `pet_catalog`, `custom`) comparten una sola máquina de estados:

```
pendiente → cotizado_envio → aceptado_por_cliente → pago_realizado → en_proceso → entregado → [ventana 7 días] → cerrado
```

Con rama de cancelación por timeout (2 días sin respuesta a cotización) o rechazo explícito (Ana determina que el pedido personalizado no es viable).

---

## 3. Roles y acceso

- **[NEGOCIO]** Un solo rol administrativo: **Ana**, autenticación JWT usuario/contraseña. **No hay roles ni permisos diferenciados en el MVP** — esto fue una decisión explícita, no un olvido. Si en el futuro se suma un asistente (empaque, atención), el módulo de auth requiere rework, no ajuste menor.
- Los clientes no tienen cuenta/login — interactúan vía formulario público y aceptación por token (correo).

---

## 4. Stack y arquitectura

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | React | Desplegado en Vercel |
| Backend | FastAPI | Desplegado en Railway |
| Base de datos | PostgreSQL | **Alojada en Railway junto al backend** (decisión consciente: acopla infra de DB al mismo proveedor/billing que el backend; no se usó un Postgres administrado aparte como Supabase/Neon) |
| Pagos | Wompi | — |
| Correo | SMTP | Usado para tokens de aceptación de cotización de envío |
| Imágenes | Cloudinary | Fotos de producto (catálogo) y fotos de referencia (pedidos personalizados) |

**[NEGOCIO]** Mantenimiento: un solo desarrollador, sin equipo. Consecuencia directa: el manejo de errores (pagos fallidos/timeouts de Wompi, estados intermedios inconsistentes) debe ser defensivo desde el MVP, no un "ya lo arreglo después" — no hay nadie más monitoreando logs en producción.

### 4.1 Modelo de datos — nota de diseño
El modelo `Order` debe tener un campo `order_type` (`catalog` / `pet_catalog` / `custom`) en vez de tres tablas o flujos separados. Los tres tipos comparten el mismo ciclo de vida de estados (sección 2.4); la diferencia real entre ellos es solo si el producto ya existe en inventario o debe fabricarse — no el flujo de pago ni de envío.

---

## 5. Identidad visual y sistema de diseño

### 5.1 Marca
- **[NEGOCIO]** Logo existente: isotipo de letra "A" formada por gancho de crochet + ovillo de lana, wordmark serif fino en mayúsculas ("ARIANI — PRODUCTOS TEJIDOS A MANO"). Ver archivo de logo subido.
- **[NEGOCIO]** Paleta monocromática confirmada como decisión de marca: rosa pastel sobre fondo crema con textura de lino.
- **[TÉCNICA]** Hex exacto del rosa **estimado desde la imagen del logo** (aprox. `#D98FA0`), no verificado contra archivo fuente — el archivo fuente del logo no está disponible. **Marcar como pendiente de ajuste** si en algún momento aparece el archivo original o manual de marca.
- **[NEGOCIO]** Segundo color: **púrpura pastel**, usado como color de acento funcional (botones primarios, estados activos, links) — no es un color de marca extraído de material existente de Ana, es una decisión tomada en esta sesión.
- **[TÉCNICA]** Tono exacto de púrpura elegido por el desarrollador buscando cumplir contraste AA (ver 5.2), ya que "pastel" puro tiende a fallar contraste sobre fondo crema. Debe documentarse el hex final cuando se implemente el sistema de tokens.

### 5.2 Estándar de calidad (verificable, no aspiracional)
- **Accesibilidad**: contraste mínimo AA de WCAG — 4.5:1 para texto normal, 3:1 para texto grande. Áreas táctiles mínimas de 44×44px en móvil.
  - **Importante**: el rosa del logo, tal como está, no cumple este estándar para uso funcional (texto, botones). Se requiere una variante más oscura/saturada del mismo matiz para esos usos; el tono claro del logo se reserva para elementos decorativos, fondos suaves y hover states.
- **Performance**: imágenes servidas vía Cloudinary con lazy loading y formato automático (WebP/AVIF). Meta de Lighthouse Performance ≥ 85 en vista de catálogo.
- **Consistencia**: sistema de diseño con tokens (paleta completa, escala tipográfica, espaciados) definidos **antes** de construir el primer componente. No se improvisan valores componente por componente.

### 5.3 Tipografía
- **[TÉCNICA]** No hay archivo fuente de la tipografía del logo. La serif del wordmark se trata como **asset de marca fijo** (uso tipo imagen/logo únicamente), no como fuente activa del sitio.
- **[TÉCNICA]** La tipografía funcional del sitio (cuerpo de texto, UI, botones) será elegida por el desarrollador desde cero, priorizando legibilidad a tamaños pequeños — sin relación directa con la serif del logo.

### 5.4 Uso de textura
- **[TÉCNICA]** La textura de lino del fondo del logo se usa solo en zonas puntuales de marca (hero, secciones destacadas), **no** como fondo global del catálogo ni del dashboard de Ana, por impacto en performance y por competir visualmente con las fotos de producto.

### 5.5 Paleta pendiente de completar
Aún falta definir explícitamente (antes de construir componentes):
- Neutrales (grises para texto secundario, bordes, fondos de tarjeta)
- Colores semánticos: éxito, error, advertencia
- Hex final de ambas variantes de rosa (marca / funcional) y del púrpura elegido

---

## 6. Preguntas que quedaron resueltas y por qué importan

| Pregunta | Resolución | Por qué era crítica |
|---|---|---|
| ¿Envío fijo por zona o cotizado? | Cotizado por Ana | Define si catálogo fijo es "compra directa" o comparte flujo con personalizados — cambia toda la arquitectura de `Order` |
| ¿Cuándo se borran fotos de referencia? | 7 días después de "entregado" | Balance entre privacidad y evidencia ante disputas/reclamos |
| ¿Roles múltiples desde el MVP? | No, solo Ana | Evita sobre-ingeniería del módulo de auth para un caso de uso que no existe todavía |
| ¿Qué pasa si el cliente no responde la cotización? | Cancelación automática a los 2 días | Sin esto, pedidos quedarían "zombie" indefinidamente en el dashboard |

---

## 7. Explícitamente fuera de alcance del MVP
- Mecanismo de descuentos/cupones (existe la necesidad de negocio, no el diseño técnico)
- Roles/permisos múltiples en el dashboard
- Envíos fuera del departamento del Atlántico
