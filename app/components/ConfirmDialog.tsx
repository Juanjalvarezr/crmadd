import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

interface Props {
  open: boolean;
  titulo?: string;
  mensaje: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, titulo = 'Confirmar eliminación', mensaje, onConfirm, onCancel }: Props) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>{titulo}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: '0.85rem' }}>{mensaje}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} size="small">Cancelar</Button>
        <Button onClick={onConfirm} size="small" variant="contained" color="error">Eliminar</Button>
      </DialogActions>
    </Dialog>
  );
}
