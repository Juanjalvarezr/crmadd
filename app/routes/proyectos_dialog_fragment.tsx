<DialogContent dividers>
  {activeProjectTab === 0 ? (
    <Box sx={{ py: 1 }}>
      <Typography variant="subtitle2" gutterBottom color="text.secondary">Descripción</Typography>
      <Typography variant="body1" paragraph>{selectedProyecto.descripcion}</Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">Cliente</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{selectedProyecto.clienteNombre}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">Presupuesto</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{formatCOP(selectedProyecto.presupuesto)}</Typography>
        </Grid>
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
            <Typography variant="subtitle2" gutterBottom>💰 Control de Pagos (50/50)</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption">Anticipo (50%): {formatCOP(selectedProyecto.presupuesto * 0.5)}</Typography>
              <SafeChip
                label={selectedProyecto.montoPagado >= (selectedProyecto.presupuesto * 0.5) ? "RECIBIDO" : "PENDIENTE"}
                size="small"
                variant={selectedProyecto.montoPagado >= (selectedProyecto.presupuesto * 0.5) ? "filled" : "outlined"}
                sx={{
                  ...(selectedProyecto.montoPagado >= (selectedProyecto.presupuesto * 0.5)
                    ? { bgcolor: '#4caf50', color: '#fff' }
                    : { borderColor: '#ff9800', color: '#ff9800' })
                }}
              />
            </Box>
            <TextField
              label="Monto Recibido"
              size="small"
              type="number"
              fullWidth
              sx={{ mb: 1, bgcolor: 'white' }}
              onBlur={(e) => handleUpdatePago(selectedProyecto, Number(e.target.value))}
              defaultValue={selectedProyecto.montoPagado}
            />
            <LinearProgress 
              variant="determinate" 
              value={(selectedProyecto.montoPagado / selectedProyecto.presupuesto) * 100} 
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>📋 Onboarding Manual (Acciones Clave)</Typography>
          {Object.entries(selectedProyecto.onboardingChecklist).map(([key, val]) => (
            <FormControlLabel
              key={key}
              control={
                <Checkbox 
                  size="small" 
                  checked={val} 
                  onChange={(e) => handleUpdateOnboarding(selectedProyecto, key, e.target.checked)} 
                />
              }
              label={<Typography variant="caption">{key.replace('_', ' ').toUpperCase()}</Typography>}
            />
          ))}
        </Grid>
      </Grid>
    </Box>
  ) : activeProjectTab === 1 ? (
    <TareasTab
      proyecto={selectedProyecto!}
      onAddTarea={handleAddTarea}
      onToggleTarea={handleToggleTarea}
      onDeleteTarea={handleDeleteTarea}
    />
  ) : activeProjectTab === 2 ? (
    <Box sx={{ py: 1 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>Brief Creativo</Typography>
      <TextField
        label="Responde las preguntas del brief de forma libre"
        size="small"
        fullWidth
        multiline
        minRows={8}
        value={typeof selectedProyecto.brief === 'string' ? selectedProyecto.brief : JSON.stringify(selectedProyecto.brief || {}, null, 2)}
        onChange={(e) => proyectosService.update(selectedProyecto.id, { brief: e.target.value })}
        sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
      />
    </Box>
  ) : activeProjectTab === 3 ? (
    <Box sx={{ py: 1 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>Cronograma del Proyecto</Typography>
      {(() => {
        const items = Array.isArray(selectedProyecto.cronograma) ? selectedProyecto.cronograma : [];
        const [nuevo, setNuevo] = useState('');
        const add = async () => {
          if (!nuevo.trim()) return;
          await proyectosService.updateCronograma(selectedProyecto.id, [...items, { titulo: nuevo.trim(), completado: false, fecha: new Date().toISOString().split('T')[0] }]);
          setSelectedProyecto(await proyectosService.getById(selectedProyecto.id));
          setNuevo('');
        };
        const toggle = async (idx: number) => {
          const next = [...items];
          next[idx] = { ...next[idx], completado: !next[idx].completado };
          await proyectosService.updateCronograma(selectedProyecto.id, next);
          setSelectedProyecto(await proyectosService.getById(selectedProyecto.id));
        };
        return (
          <Stack spacing={1}>
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                fullWidth
                placeholder="Ej: Grabación reel semana 2"
                value={nuevo}
                onChange={(e) => setNuevo(e.target.value)}
              />
              <Button variant="contained" size="small" onClick={add} disabled={!nuevo.trim()}>Agregar</Button>
            </Stack>
            <List dense>
              {items.map((item: any, i: number) => (
                <ListItem key={i} disableGutters secondaryAction={
                  <IconButton size="small" onClick={() => toggle(i)}>
                    {item.completado ? <CheckCircle size={16} color="#4caf50" /> : <Play size={16} color="#9e9e9e" />}
                  </IconButton>
                }>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {item.completado ? <CheckCircle size={18} color="#4caf50" /> : <Clock size={18} color="#9e9e9e" />}
                  </ListItemIcon>
                  <ListItemText primaryTypographyProps={{ fontSize: '0.75rem', sx: { textDecoration: item.completado ? 'line-through' : 'none', color: item.completado ? 'text.disabled' : 'text.primary' } }} primary={item.titulo || item} secondary={item.fecha ? new Date(item.fecha).toLocaleDateString('es-CO') : undefined} secondaryTypographyProps={{ fontSize: '0.65rem' }} />
                </ListItem>
              ))}
              {items.length === 0 && <ListItem disableGutters><ListItemText primaryTypographyProps={{fontSize: '0.75rem'}} primary="Pendiente por definir" /></ListItem>}
            </List>
          </Stack>
        );
      })()}
    </Box>
  ) : activeProjectTab === 4 ? (
    <Box sx={{ py: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Award size={18} color="#e91e63" /> Fase Administrativa Actual
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          startIcon={generatingPlan ? <CircularProgress size={14} /> : <Zap size={14} />}
          onClick={handleGenerarPlanIA}
          disabled={generatingPlan}
          sx={{ color: '#e91e63', borderColor: '#e91e63' }}
        >
          {generatingPlan ? "Generando..." : "Generar Plan con IA"}
        </Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 4, flexWrap: 'wrap' }}>
        {["propuesta", "contrato", "onboarding", "operacion", "capacitacion", "renovacion"].map((fase) => (
          <Chip
            key={fase}
            label={fase.charAt(0).toUpperCase() + fase.slice(1)}
            size="small"
            variant={selectedProyecto.planContenido?.faseActual === fase ? "filled" : "outlined"}
            onClick={() => proyectosService.updatePlanFase(selectedProyecto.id, fase)}
            sx={{ 
              textTransform: 'capitalize',
              '&.Mui-focusVisible': { outline: 'none' }
            }}
          />
        ))}
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Plan de Contenido</Typography>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              label="Nombre de la pauta (Ej: Reel lanzamiento)"
              value={nuevoItemTitulo}
              onChange={(e) => setNuevoItemTitulo(e.target.value)}
            />
            <Button variant="contained" size="small" onClick={() => handleAddPlanItem('pauta')} disabled={!nuevoItemTitulo.trim()}>Agregar Pauta</Button>
          </Box>
          <List dense sx={{ maxHeight: 330, overflow: 'auto' }}>
            {(selectedProyecto.planContenido?.pauta || []).map((texto: string, i: number) => (
              <ListItem key={i} disableGutters secondaryAction={
                <IconButton size="small" onClick={() => handleDeletePlanItem('pauta', i)}>
                  <Trash2 size={14} />
                </IconButton>
              }>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircle size={18} />
                </ListItemIcon>
                <ListItemText primary={texto} />
              </ListItem>
            ))}
            {(selectedProyecto.planContenido?.pauta || []).length === 0 && (
              <ListItem disableGutters>
                <ListItemText primaryTypographyProps={{fontSize: '0.75rem'}} primary="Sin pautas por ahora" />
              </ListItem>
            )}
          </List>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
          
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                size="small"
                fullWidth
                label="Nueva entrega"
                value={nuevaEntregaTitulo}
                onChange={(e) => setNuevaEntregaTitulo(e.target.value)}
              />
              <DatePicker
                label="Fecha"
                value={nuevaEntregaFecha}
                onChange={(newValue) => setNuevaEntregaFecha(newValue)}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { minWidth: 160 }
                  }
                }}
              />
              <Button variant="contained" size="small" onClick={() => handleAddEntrega()} disabled={!nuevaEntregaTitulo.trim() || !nuevaEntregaFecha}>Agregar</Button>
            </Box>
            <List dense>
              {(selectedProyecto.planContenido?.entregas || []).map((ent: any, i: number) => {
                const dias = ent.fecha ? Math.ceil((new Date(ent.fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                let colorFecha = 'text.secondary';
                if (dias !== null) {
                  if (dias < 0) colorFecha = 'error.main';
                  else if (dias <= 7) colorFecha = 'warning.main';
                  else colorFecha = 'success.main';
                }
                return (
                  <ListItem key={i} disableGutters secondaryAction={
                    <Box sx={{ mr: 1, textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: colorFecha, display: 'block' }}>
                        {dias === null ? 'Sin fecha' : dias === 0 ? 'HOY' : dias > 0 ? `+${dias}d` : `${dias}d`}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        {ent.fecha ? new Date(ent.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : ''}
                      </Typography>
                    </Box>
                  }>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Calendar size={18} color="#e91e63" />
                    </ListItemIcon>
                    <ListItemText 
                      primaryTypographyProps={{ sx: { fontWeight: 600, color: dias !== null && dias < 0 ? 'error.main' : 'text.primary' } }}
                      primary={ent.titulo} 
                    />
                    <IconButton size="small" color="error" sx={{ ml: 1 }} onClick={() => handleDeleteEntrega(i)}>
                      <Trash2 size={16} />
                    </IconButton>
                  </ListItem>
                );
              })}
              {(selectedProyecto.planContenido?.entregas || []).length === 0 && (
                <ListItem disableGutters>
                  <ListItemText primaryTypographyProps={{fontSize: '0.75rem'}} primary="Sin entregas pendientes" />
                </ListItem>
              )}
            </List>
          )}
        </Box>
      </Paper>
    </Box>
  ) : activeProjectTab === 5 ? (
    <Box sx={{ py: 1 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>Canales Digitales</Typography>
      <Stack spacing={1}>
        {['Instagram', 'Facebook', 'TikTok', 'YouTube', 'LinkedIn', 'Google Business', 'Página Web'].map((canal) => {
          const link = (selectedProyecto.canales || {})[canal];
          return (
            <Box key={canal} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={canal} size="small" variant="outlined" sx={{ minWidth: 160 }} />
              <TextField
                size="small"
                fullWidth
                placeholder={`https://...`}
                value={link || ''}
                onChange={(e) => {
                  const updated = { ...(selectedProyecto.canales || {}), [canal]: e.target.value };
                  proyectosService.update(selectedProyecto.id, { canales: updated });
                  setSelectedProyecto({ ...selectedProyecto, canales: updated });
                }}
              />
            </Box>
          );
        })}
      </Stack>
    </Box>
  ) : activeProjectTab === 6 ? (
    <Box sx={{ py: 1 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>Contrato y Facturación</Typography>
      <Stack spacing={1}>
        <Button variant="outlined" size="small" startIcon={<FiFileText />} onClick={async () => {
          try {
            const pdfUrl = await contratosService.generarContratoPDF(selectedProyecto);
            showNotification('Contrato generado: descargalo desde /contratos', 'success');
          } catch (e: any) { showNotification('Error: ' + e.message, 'error'); }
        }}>Generar contrato</Button>
        <Button variant="outlined" size="small" startIcon={<FiFileText />} onClick={async () => {
          try {
            const pdfUrl = await facturasService.generarFacturaPDF(selectedProyecto);
            showNotification('Factura generada', 'success');
          } catch (e: any) { showNotification('Error: ' + e.message, 'error'); }
        }}>Generar factura</Button>
        {(selectedProyecto as any).contrato_url && (
          <Button size="small" variant="text" href={(selectedProyecto as any).contrato_url} target="_blank">Abrir contrato</Button>
        )}
        {selectedProyecto.facturacion_detalle && (
          <Alert severity="info" sx={{ whiteSpace: 'pre-wrap' }}>{typeof selectedProyecto.facturacion_detalle === 'string' ? selectedProyecto.facturacion_detalle : JSON.stringify(selectedProyecto.facturacion_detalle, null, 2)}</Alert>
        )}
      </Stack>
    </Box>
  ) : (
    /* PESTAÑA DE CREDENCIALES */
    <Box sx={{ py: 1 }}>
      
    </Box>
  ) : (
    /* PESTAÑA DE RECURSOS (GOOGLE INTEGRATION) */
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Credenciales y Accesos</Typography>
        <Button
          size="small"
          variant="contained"
          onClick={async () => {
            const canal = prompt('Canal (Google, Hostinger, Meta, Tiendanube...)', 'Google') || '';
            const usuario = prompt('Usuario / email') || '';
            const contrasena = prompt('Contraseña', '') || '';
            const url = prompt('URL (opcional)') || '';
            if (!canal) return;
            try {
              await credencialesService.create({ proyecto_id: String(selectedProyecto.id), tipo: 'cuenta', canal, usuario, contrasena, url });
              showNotification('Credencial guardada', 'success');
            } catch (e: any) { showNotification('Error: ' + e.message, 'error'); }
          }}
          startIcon={<Plus size={14} />}
        >Agregar</Button>
      </Stack>
      {credenciales.length === 0 && (
        <Alert severity="info">Sin credenciales cargadas.</Alert>
      )}
      <List dense>
        {credenciales.map((c: any) => (
          <ListItem key={c.id} disableGutters secondaryAction={
            <IconButton size="small" color="error" onClick={async () => { try { await credencialesService.delete(c.id); setCredenciales((prev: any[]) => prev.filter((x: any) => x.id !== c.id)); showNotification('Eliminado', 'success'); } catch (e:any) { showNotification('Error','error'); } }}>
              <Trash2 size={16} />
            </IconButton>
          }>
            <ListItemIcon sx={{ minWidth: 32 }}><ExternalLink size={18} /></ListItemIcon>
            <ListItemText
              primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{c.canal} · {c.usuario}</Typography>}
              secondary={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{mostrarPwd[c.id] ? (c.contrasena || '') : '••••••••'}</Typography>
                  <IconButton size="small" onClick={() => setMostrarPwd((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}>
                    {mostrarPwd[c.id] ? <Eye size={14} color="#9e9e9e"/> : <Eye size={14} color="#9e9e9e"/>}
                  </IconButton>
                </Stack>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  )
</DialogContent>
