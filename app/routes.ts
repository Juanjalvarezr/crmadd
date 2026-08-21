import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/index.tsx"),
	route("/login", "routes/login.tsx"),
	route("/clientes", "routes/clientes.tsx"),
	route("/servicios", "routes/servicios.tsx"),
	route("/ventas", "routes/ventas.tsx"),
	route("/tareas", "routes/tareas.tsx"),
	route("/", "routes/index.tsx"),
	route("/proyectos", "routes/proyectos.tsx"),
	route("/email-marketing", "routes/email-marketing.tsx"),
	route("/public/proyecto/:id", "routes/public/proyecto/$id.tsx"),
	route("/calendario", "routes/calendario.tsx"),
	route("/reportes", "routes/reportes.tsx"),
	route("/configuracion", "routes/configuracion.tsx"),
	route("/equipo", "routes/equipo.tsx"),
	route("/facturacion", "routes/facturacion.tsx"),
	route("/cotizaciones", "routes/cotizaciones.tsx"),
	route("/contratos", "routes/contratos.tsx"),
	route("/documentos", "routes/documentos.tsx"),
] satisfies RouteConfig;
