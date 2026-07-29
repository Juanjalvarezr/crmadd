import React from "react";
import { Menu, MenuItem, IconButton, Tooltip, Box } from "@mui/material";
import { FiEye, FiEdit, FiGitBranch, FiShield, FiMessageSquare, FiMail, FiFileText, FiTrash2, FiMoreVertical } from "react-icons/fi";

interface MenuActionsProps {
  item: any;
  bloqueado: boolean;
  telefono: string;
  email: string;
  sendingWhatsApp: string | null;
  onVer: () => void;
  onEditar: () => void;
  onHistorial: () => void;
  onFirmar: () => void;
  onWhatsApp: () => void;
  onEmail: () => void;
  onPDF: () => void;
  onEliminar: () => void;
}

const MenuActions: React.FC<MenuActionsProps> = ({
  item,
  bloqueado,
  telefono,
  email,
  sendingWhatsApp,
  onVer,
  onEditar,
  onHistorial,
  onFirmar,
  onWhatsApp,
  onEmail,
  onPDF,
  onEliminar,
}) => {
  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
  const handleClose = () => setAnchor(null);

  return (
    <Box>
      <Tooltip title="Acciones">
        <IconButton size="small" onClick={handleClick}>
          <FiMoreVertical size={16} />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={!!anchor} onClose={handleClose} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
        <MenuItem onClick={() => { onVer(); handleClose(); }}><FiEye style={{ marginRight: 8 }} /> Ver</MenuItem>
        <MenuItem onClick={() => { onEditar(); handleClose(); }} disabled={bloqueado}><FiEdit style={{ marginRight: 8 }} /> Editar</MenuItem>
        <MenuItem onClick={() => { onHistorial(); handleClose(); }}><FiGitBranch style={{ marginRight: 8 }} /> Historial</MenuItem>
        <MenuItem onClick={() => { onFirmar(); handleClose(); }} disabled={bloqueado || item.estado === "cancelado"}><FiShield style={{ marginRight: 8 }} /> Firmar</MenuItem>
        <MenuItem onClick={() => { onWhatsApp(); handleClose(); }} disabled={!telefono || sendingWhatsApp === item.id}><FiMessageSquare style={{ marginRight: 8 }} /> WhatsApp</MenuItem>
        <MenuItem onClick={() => { onEmail(); handleClose(); }} disabled={!email}><FiMail style={{ marginRight: 8 }} /> Email</MenuItem>
        <MenuItem onClick={() => { onPDF(); handleClose(); }}><FiFileText style={{ marginRight: 8 }} /> PDF</MenuItem>
        <MenuItem onClick={() => { onEliminar(); handleClose(); }} disabled={bloqueado} sx={{ color: "error.main" }}><FiTrash2 style={{ marginRight: 8 }} /> Eliminar</MenuItem>
      </Menu>
    </Box>
  );
};

export default MenuActions;
