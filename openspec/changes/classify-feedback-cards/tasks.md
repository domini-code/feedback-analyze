## 1. Setup y dependencias

- [ ] 1.1 Instalar `@anthropic-ai/sdk` como dependencia del proyecto
- [ ] 1.2 Añadir `ANTHROPIC_API_KEY` al archivo `.env.local` (y documentarlo en `.env.example`)
- [ ] 1.3 Definir los tipos TypeScript compartidos: `FeedbackCategory`, `ClassificationResult`, `FeedbackItem`

## 2. API de clasificación

- [ ] 2.1 Crear route handler `app/api/classify/route.ts` que acepte `POST { entries: string[] }`
- [ ] 2.2 Implementar la llamada a Claude con `tool_use` y JSON schema `{ category, confidence }` para garantizar output estructurado
- [ ] 2.3 Clasificar todas las entradas en paralelo con `Promise.all`
- [ ] 2.4 Manejar errores por entrada sin interrumpir el batch (retornar `{ category: "error", confidence: 0 }`)
- [ ] 2.5 Validar presencia de `ANTHROPIC_API_KEY` al arrancar; retornar HTTP 500 descriptivo si falta
- [ ] 2.6 Validar en el handler que el array no supere 50 entradas; retornar HTTP 400 si se excede

## 3. Componente de entrada de feedback

- [ ] 3.1 Crear componente `FeedbackInput` con `<textarea>` para ingresar múltiples líneas
- [ ] 3.2 Implementar lógica de parseo: dividir por `\n`, filtrar líneas vacías
- [ ] 3.3 Añadir validación: deshabilitar botón "Clasificar" si no hay líneas válidas
- [ ] 3.4 Añadir validación de límite de 50 entradas con mensaje de error visible
- [ ] 3.5 Mostrar estado de loading (botón deshabilitado + spinner) mientras la petición está en curso

## 4. Store y persistencia

- [ ] 4.1 Crear custom hook `useFeedbackStore` que gestiona el array de `FeedbackItem` en estado React
- [ ] 4.2 Sincronizar el store con `localStorage` (lectura al montar, escritura en cada cambio)
- [ ] 4.3 Implementar acción `addItems(items: FeedbackItem[])` que agrega resultados nuevos sin reemplazar los anteriores

## 5. Componente de cards

- [ ] 5.1 Crear componente `FeedbackCard` que muestra texto, badge de categoría y porcentaje de confianza
- [ ] 5.2 Aplicar colores de badge por categoría: `bug`→rojo, `feature-request`→azul, `praise`→verde, `pain-point`→amarillo
- [ ] 5.3 Crear componente `FeedbackCardSkeleton` para el estado de carga
- [ ] 5.4 Crear componente `FeedbackCardGrid` que renderiza la lista de cards (o skeletons durante la carga)

## 6. Componente de filtros

- [ ] 6.1 Crear componente `FeedbackFilters` con un botón toggle por cada categoría
- [ ] 6.2 Mostrar el contador de items por categoría junto a cada botón (basado en el total sin filtrar)
- [ ] 6.3 Implementar lógica multi-selección: ningún filtro activo = mostrar todo
- [ ] 6.4 Conectar filtros al `FeedbackCardGrid` para filtrado client-side inmediato

## 7. Integración en la página principal

- [ ] 7.1 Componer `FeedbackInput`, `FeedbackFilters` y `FeedbackCardGrid` en `app/page.tsx`
- [ ] 7.2 Conectar el submit de `FeedbackInput` con el llamado a `/api/classify` y la actualización del store
- [ ] 7.3 Mostrar skeletons durante la carga y reemplazarlos por cards al recibir resultados
- [ ] 7.4 Verificar flujo completo: ingresar feedback → clasificar → ver cards → filtrar → recargar página y ver historial
