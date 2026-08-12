
CREATE OR REPLACE VIEW vista_agente_perfil AS
SELECT
  e.id,
  e.nombre,
  e.email,
  e.rol,
  e.especialidad,
  e.estado,
  e.skills,
  e.herramientas,
  e.capacidad_max_proyectos,
  e.proyectos_activos,
  e.modo_operativo,
  e.agent_prompt_slug,
  e.bio,
  e.avatar_url,
  COALESCE(
    jsonb_object_agg(ap.modulo, ap.acciones) FILTER (WHERE ap.modulo IS NOT NULL),
    '{}'::jsonb
  ) AS permisos_por_modulo
FROM equipo e
LEFT JOIN agente_permisos ap ON ap.agente_id = e.id
GROUP BY e.id;

COMMENT ON VIEW vista_agente_perfil IS 'Perfil operativo de cada agente con skills, herramientas, capacidad y permisos agregados.';
