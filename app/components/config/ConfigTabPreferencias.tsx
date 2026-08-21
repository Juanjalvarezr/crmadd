import React from "react";

interface Props {
  // Add needed props per tab
}

export const ConfigTabPreferencias: React.FC<Props> = () => {
  return (
          {activeTab === "preferencias" && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                Preferencias de Usuario
              </Typography>
              
              <Grid container spacing={{ xs: 1, sm: 2 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tema</InputLabel>
                    <Select
                      value={preferenciasConfig.tema}
                      label="Tema"
                      onChange={(e) => setPreferenciasConfig({ ...preferenciasConfig, tema: e.target.value as "light" | "dark" | "auto" })}
                    >
                      <MenuItem value="light">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <FiSun size={16} />
                          Claro
                        </Box>
                      </MenuItem>
                      <MenuItem value="dark">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <FiMoon size={16} />
                          Oscuro
                        </Box>
                      </MenuItem>
                      <MenuItem value="auto">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <FiGlobe size={16} />
                          Automático
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Idioma</InputLabel>
                    <Select
                      value={preferenciasConfig.idioma}
                      label="Idioma"
                      onChange={(e) => setPreferenciasConfig({ ...preferenciasConfig, idioma: e.target.value as "es" | "en" })}
                    >
                      <MenuItem value="es">Español</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Zona Horaria</InputLabel>
                    <Select
                      value={preferenciasConfig.zonaHoraria}
                      label="Zona Horaria"
                      onChange={(e) => setPreferenciasConfig({ ...preferenciasConfig, zonaHoraria: e.target.value })}
                    >
                      <MenuItem value="America/Bogota">America/Bogota (GMT-5)</MenuItem>
                      <MenuItem value="America/Mexico_City">America/Mexico City (GMT-6)</MenuItem>
                      <MenuItem value="America/New_York">America/New York (GMT-5)</MenuItem>
                      <MenuItem value="Europe/Madrid">Europe/Madrid (GMT+1)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Formato de Fecha</InputLabel>
                    <Select
                      value={preferenciasConfig.formatoFecha}
                      label="Formato de Fecha"
                      onChange={(e) => setPreferenciasConfig({ ...preferenciasConfig, formatoFecha: e.target.value })}
                    >
                      <MenuItem value="dd/MM/yyyy">DD/MM/YYYY</MenuItem>
                      <MenuItem value="MM/dd/yyyy">MM/DD/YYYY</MenuItem>
                      <MenuItem value="yyyy-MM-dd">YYYY-MM-DD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Formato de Moneda</InputLabel>
                    <Select
                      value={preferenciasConfig.formatoMoneda}
                      label="Formato de Moneda"
                      onChange={(e) => setPreferenciasConfig({ ...preferenciasConfig, formatoMoneda: e.target.value })}
                    >
                      <MenuItem value="COP">COP - Peso Colombiano</MenuItem>
                      <MenuItem value="USD">USD - Dólar Americano</MenuItem>
                      <MenuItem value="EUR">EUR - Euro</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>              
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                Rendimiento (Punto 2)
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={true} // Por defecto activo para velocidad
                    color="primary"
                  />
                }
                label="Caché Inteligente (Mejora la velocidad de carga global)"
              />
              <Divider sx={{ my: 3 }} />              
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                Notificaciones
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferenciasConfig.notificacionesEmail}
                        onChange={(e) => setPreferenciasConfig({ ...preferenciasConfig, notificacionesEmail: e.target.checked })}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FiMail size={16} />
                        <Typography variant="body2">Notificaciones por Email</Typography>
                      </Box>
                    }
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferenciasConfig.notificacionesPush}
                        onChange={(e) => setPreferenciasConfig({ ...preferenciasConfig, notificacionesPush: e.target.checked })}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FiBell size={16} />
                        <Typography variant="body2">Notificaciones Push</Typography>
                      </Box>
                    }
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferenciasConfig.notificacionesInApp}
                        onChange={(e) => setPreferenciasConfig({ ...preferenciasConfig, notificacionesInApp: e.target.checked })}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FiAlertCircle size={16} />
                        <Typography variant="body2">Notificaciones en App</Typography>
                      </Box>
                    }
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                <Button 
                  variant="contained"
                  startIcon={<FiSave />}
                  onClick={handleSavePreferencias}
                  sx={{ backgroundColor: BRAND.secondary, '&:hover': { backgroundColor: "#c2185b" } }}
                >
                  Guardar Preferencias
                </Button>
              </Box>
            </Paper>
          )}

          {/* Configuración de Seguridad */}
  );
};
