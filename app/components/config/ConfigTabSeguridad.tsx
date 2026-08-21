import React from "react";

interface Props {
  // Add needed props per tab
}

export const ConfigTabSeguridad: React.FC<Props> = () => {
  return (
          {activeTab === "seguridad" && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                Seguridad de la Cuenta
              </Typography>
              
              <Grid container spacing={{ xs: 1, sm: 2 }}>
                <Grid item xs={12}>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: "bold" }}>Cambiar Contraseña</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Actualiza tu contraseña de acceso al CRM
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          startIcon={<FiLock />}
                          onClick={() => setSeguridadConfig({ ...seguridadConfig, cambiarPassword: !seguridadConfig.cambiarPassword })}
                        >
                          Cambiar
                        </Button>
                      </Box>
                      
                      {seguridadConfig.cambiarPassword && (
                        <Box sx={{ mt: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <TextField
                                type="password"
                                label="Contraseña Actual"
                                fullWidth
                                value={seguridadConfig.passwordActual}
                                onChange={(e) => setSeguridadConfig({ ...seguridadConfig, passwordActual: e.target.value })}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                type="password"
                                label="Nueva Contraseña"
                                fullWidth
                                value={seguridadConfig.passwordNuevo}
                                onChange={(e) => setSeguridadConfig({ ...seguridadConfig, passwordNuevo: e.target.value })}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                type="password"
                                label="Confirmar Nueva Contraseña"
                                fullWidth
                                value={seguridadConfig.passwordConfirmar}
                                onChange={(e) => setSeguridadConfig({ ...seguridadConfig, passwordConfirmar: e.target.value })}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <Button
                                variant="contained"
                                startIcon={<FiCheck />}
                                onClick={handleCambioPassword}
                                sx={{ backgroundColor: BRAND.success, '&:hover': { backgroundColor: "#388e3c" } }}
                              >
                                Actualizar Contraseña
                              </Button>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: "bold" }}>Autenticación 2FA</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Añade una capa extra de seguridad
                          </Typography>
                        </Box>
                        <Switch
                          checked={seguridadConfig.autenticacion2FA}
                          onChange={(e) => setSeguridadConfig({ ...seguridadConfig, autenticacion2FA: e.target.checked })}
                          color="primary"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: "bold" }}>Sesiones Activas</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {seguridadConfig.sesionesActivas} dispositivos conectados
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          startIcon={<FiRefreshCw />}
                          onClick={() => globalSnack.show("Gestión de sesiones en desarrollo", "info")}
                        >
                          Gestionar
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Configuración del Cerebro AI */}
  );
};
