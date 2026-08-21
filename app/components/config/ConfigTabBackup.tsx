import React from "react";

interface Props {
  // Add needed props per tab
}

export const ConfigTabBackup: React.FC<Props> = () => {
  return (
          {activeTab === "backup" && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                Backup y Restauración
              </Typography>
              
              <Grid container spacing={{ xs: 1, sm: 2 }}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                        <FiDownload size={24} color={BRAND.success} />
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>Crear Backup</Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Descarga una copia completa de tu configuración y datos del CRM
                      </Typography>
                      
                      <Button
                        variant="contained"
                        startIcon={<FiDownload />}
                        onClick={() => setOpenBackupDialog(true)}
                        sx={{ backgroundColor: BRAND.success, '&:hover': { backgroundColor: "#388e3c" } }}
                      >
                        Descargar Backup
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                        <FiUpload size={24} color="#ff9800" />
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>Restaurar Backup</Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Sube un archivo de backup para restaurar tu configuración
                      </Typography>
                      
                      <Button
                        variant="contained"
                        startIcon={<FiUpload />}
                        onClick={() => setOpenRestoreDialog(true)}
                        sx={{ backgroundColor: "#ff9800", '&:hover': { backgroundColor: "#f57c00" } }}
                      >
                        Subir Backup
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>              
              <Divider sx={{ my: 3 }} />              
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                Historial de Backups
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <FiDatabase />
                  </ListItemIcon>
                  <ListItemText
                    primary="Backup Automático - 11 de Mayo 2026"
                    secondary="Tamaño: 2.4 MB • Completado exitosamente"
                  />
                  <ListItemSecondaryAction>
                    <Button size="small" startIcon={<FiDownload />}>
                      Descargar
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <FiDatabase />
                  </ListItemIcon>
                  <ListItemText
                    primary="Backup Manual - 8 de Mayo 2026"
                    secondary="Tamaño: 2.1 MB • Completado exitosamente"
                  />
                  <ListItemSecondaryAction>
                    <Button size="small" startIcon={<FiDownload />}>
                      Descargar
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </Paper>
          )}

          {/* Datos Reales */}
          {activeTab === "datos" && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                Inicialización con Datos Reales de DESEO DIGITAL
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configura y llena tu CRM con los datos de producción reales de las 9 empresas que colaboran activamente con <strong>DESEO DIGITAL</strong>. Esto limpiará las tablas existentes de prueba y las poblará con datos de alta fidelidad para el monitoreo real del negocio.
              </Typography>
              
              <Alert severity="warning" sx={{ mb: 3 }}>
                <strong>⚠️ Nota de Limpieza Segura:</strong> Esta acción borrará los registros de prueba y simulación actuales de Clientes, Ventas (Oportunidades), Tareas y Proyectos, y los reemplazará con tus 9 empresas reales (Ecopark, Hogar City, Deseo Digital, Rx Imado, Vitalvan, Autolujos, Grupo Iuris, Gaturros y Mepalex) con sus respectivos representantes y presupuestos.
              </Alert>

              <Button
                variant="contained"
                size="large"
                startIcon={<FiRefreshCw />}
                onClick={handleSeedRealData}
                sx={{ 
                  backgroundColor: BRAND.secondary, 
                  '&:hover': { backgroundColor: "#c2185b" },
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                  fontWeight: 'bold'
                }}
              >
                Cargar Datos Reales de DESEO DIGITAL
              </Button>
            </Paper>
          )}
        </>
      )}

      {/* Diálogo de Backup */}
      <Dialog open={openBackupDialog} onClose={() => setOpenBackupDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Crear Backup
            <IconButton onClick={() => setOpenBackupDialog(false)}>
              <FiX />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Estás seguro de crear un backup completo del CRM?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Esto incluirá toda tu configuración, preferencias y datos. El proceso puede tardar unos minutos.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBackupDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleBackup}
            variant="contained"
            sx={{ backgroundColor: BRAND.success, '&:hover': { backgroundColor: "#388e3c" } }}
          >
            Crear Backup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Restauración */}
      <Dialog open={openRestoreDialog} onClose={() => setOpenRestoreDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Restaurar Backup
            <IconButton onClick={() => setOpenRestoreDialog(false)}>
              <FiX />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Selecciona un archivo de backup para restaurar:
          </Typography>
          <Box
            component="input"
            type="file"
            accept=".json"
            title="Seleccionar archivo de backup"
            onChange={(e: any) => {
              const file = e.target.files?.[0];
              if (file) {
                handleRestore(file);
              }
            }}
            sx={{ width: "100%" }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            ⚠️ Advertencia: Esto sobrescribirá tu configuración actual.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRestoreDialog(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para Agregar Conocimiento */}
      <Dialog open={openConocimientoModal} onClose={() => setOpenConocimientoModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Agregar Conocimiento al Cerebro</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField 
                label="Título (ej: Guion de Ventas, Brief Creativo)" 
                fullWidth 
                value={nuevoConocimiento.titulo}
                onChange={e => setNuevoConocimiento({...nuevoConocimiento, titulo: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select 
                  value={nuevoConocimiento.categoria}
                  label="Categoría"
                  onChange={e => setNuevoConocimiento({...nuevoConocimiento, categoria: e.target.value})}
                >
                  <MenuItem value="operaciones">Operaciones</MenuItem>
                  <MenuItem value="ventas">Ventas</MenuItem>
                  <MenuItem value="contratacion">Contratación</MenuItem>
                  <MenuItem value="templates">Templates/Formatos</MenuItem>
                  <MenuItem value="marca">Manual de Marca</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField 
                label="Contenido / Cuerpo del Manual" 
                fullWidth 
                multiline 
                rows={10} 
                value={nuevoConocimiento.contenido}
                onChange={e => setNuevoConocimiento({...nuevoConocimiento, contenido: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConocimientoModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddConocimiento} sx={{ bgcolor: '#e91e63' }}>Guardar en el Cerebro</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para Retroalimentar/Editar Prompt */}
      <Dialog open={openPromptModal} onClose={() => setOpenPromptModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Ajustar Inteligencia: {editingPrompt?.slug.replace(/_/g, ' ')}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption" color="primary" sx={{ mb: 2, display: 'block' }}>
            💡 Aquí es donde "retroalimentas" a la IA. Cambia sus instrucciones para que sea más precisa.
          </Typography>
          <TextField
            label="Instrucción de Personalidad (System Prompt)"
            fullWidth
            multiline
            rows={3}
            value={editingPrompt?.system_prompt || ""}
            onChange={(e) => setEditingPrompt({...editingPrompt, system_prompt: e.target.value})}
            sx={{ mb: 3, mt: 1 }}
          />
          <TextField
            label="Plantilla de Respuesta (User Prompt Template)"
            fullWidth
            multiline
            rows={8}
            value={editingPrompt?.user_prompt_template || ""}
            onChange={(e) => setEditingPrompt({...editingPrompt, user_prompt_template: e.target.value})}
            helperText="Usa {{variable}} para los datos dinámicos del CRM."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPromptModal(false)}>Cerrar</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdatePrompt} 
            sx={{ bgcolor: '#e91e63' }}
          >
            Guardar y Actualizar Cerebro
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Plantillas de Documentos */}
      <Dialog open={openDocTemplateModal} onClose={() => setOpenDocTemplateModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingDocTemplateId ? "Editar plantilla" : "Nueva plantilla"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select value={docTemplateForm.tipo} label="Tipo" onChange={(e) => setDocTemplateForm({ ...docTemplateForm, tipo: e.target.value as any })}>
                  <MenuItem value="cotizacion">Cotización</MenuItem>
                  <MenuItem value="factura">Factura</MenuItem>
                  <MenuItem value="contrato">Contrato</MenuItem>
                  <MenuItem value="recibo">Recibo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Nombre" size="small" fullWidth value={docTemplateForm.nombre} onChange={(e) => setDocTemplateForm({ ...docTemplateForm, nombre: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="IVA %" size="small" fullWidth type="number" value={docTemplateForm.iva_porcentaje} onChange={(e) => setDocTemplateForm({ ...docTemplateForm, iva_porcentaje: Number(e.target.value || 0) })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Color primario" size="small" fullWidth value={docTemplateForm.color_primario} onChange={(e) => setDocTemplateForm({ ...docTemplateForm, color_primario: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Color secundario" size="small" fullWidth value={docTemplateForm.color_secundario} onChange={(e) => setDocTemplateForm({ ...docTemplateForm, color_secundario: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Logo URL (opcional)" size="small" fullWidth value={docTemplateForm.logo_url} onChange={(e) => setDocTemplateForm({ ...docTemplateForm, logo_url: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Contenido" size="small" fullWidth multiline minRows={8} value={docTemplateForm.contenido} onChange={(e) => setDocTemplateForm({ ...docTemplateForm, contenido: e.target.value })} helperText="Variables permitidas: {{cliente.nombre}}, {{factura.numero}}, {{factura.total}}, {{empresa.nombre}}, {{fecha}}." />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDocTemplateModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveDocTemplate}>Guardar plantilla</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
  );
};
