import os

path = r'C:\Users\jujoa\crm-agencia\app\routes\proyectos.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = '''      {!loading && !error && (
        <Grid container spacing={3}>
          {proyectosFiltrados.map((proyecto) => (
            <Grid item xs={12} md={6} lg={4} key={proyecto.id}>
              <ExpandableCard
                title={proyecto.nombre}
                subtitle={proyecto.descripcion}
                status={{ label: proyecto.estado.replace("_", " "), color: getEstadoColor(proyecto.estado) }}
                priority={{ label: proyecto.prioridad, color: getPrioridadColor(proyecto.prioridad) }}
                date={\`\\u{1F4C5} \${format(new Date(proyecto.fechaInicio), "dd/MM/yyyy")} \\u{1F3AF} \${format(new Date(proyecto.fechaFin), "dd/MM/yyyy")}\`}
                amount={\`Presupuesto: ${formatCOP(proyecto.presupuesto)}\`}
                titleColor={getEstadoColor(proyecto.estado)}
                footer={
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Tooltip title="Compartir progreso con cliente (Magic Link)">
                      <IconButton size="small" color="primary" onClick={() => handleGenerateMagicLink(proyecto)}>
                        <Share2 size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Ver detalles">
                      <IconButton size="small" onClick={() => setSelectedProyecto(proyecto)}>
                        <Eye size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleOpenProyectoModal(proyecto)}>
                        <Edit2 size={18} />
                      </IconButton>
                    </Tooltip>
                    {proyecto.estado === "en_progreso" && (
                      <Tooltip title="Pausar">
                        <IconButton size="small" onClick={() => handleCambiarEstado(proyecto, "pausado")}>
                          <Pause size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {proyecto.estado === "pausado" && (
                      <Tooltip title="Reanudar">
                        <IconButton size="small" onClick={() => handleCambiarEstado(proyecto, "en_progreso")}>
                          <Play size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {proyecto.estado === "en_progreso" && (
                      <Tooltip title="Completar">
                        <IconButton size="small" onClick={() => handleCambiarEstado(proyecto, "completado")}>
                          <CheckCircle size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => handleDeleteProyecto(proyecto)}>
                        <Trash2 size={18} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
                onClick={() => setSelectedProyecto(proyecto)}
              >
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      Cliente: {proyecto.clienteNombre}
                    </Typography>
                    <Chip
                      label={proyecto.faseAdministrativa || "operacion"}
                      size="small"
                      sx={{ fontSize: '0.65rem', height: 20, bgcolor: 'action.hover', color: 'text.primary' }}
                    />
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {(proyecto.servicios || []).map((servicio, index) => (
                      <Chip
                        key={index}
                        label={servicio}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.65rem", height: 22 }}
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                    Progreso: {proyecto.progreso}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={proyecto.progreso}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#e0e0e0",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                        backgroundColor: getEstadoColor(proyecto.estado)
                      }
                    }}
                  />
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, flexWrap: "wrap", gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Actualizado: {formatDistanceToNow(new Date(proyecto.actualizadoEn), { addSuffix: true, locale: es })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Costo: {formatCOP(proyecto.costoActual)}
                  </Typography>
                </Box>
              </ExpandableCard>
            </Grid>
          ))}
        </Grid>
      )}'''

if old in content:
    content = content.replace(old, 'PLACEHOLDER_REPLACED')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Found and replaced with placeholder')
else:
    print('Old block not found')
