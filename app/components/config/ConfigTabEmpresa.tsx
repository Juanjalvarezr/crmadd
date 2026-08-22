import { Box, Typography, Paper, TextField, Button, Chip } from "@mui/material";
import { FiBuilding } from "react-icons/fi";

interface Props {
  config: any;
  onChange: (config: any) => void;
  onSave: () => void;
  saving?: boolean;
}

export const ConfigTabEmpresa = ({ config, onChange, onSave, saving }: Props) => (
  <Box sx={ display: "flex", flexDirection: "column", gap: 2 }>
                <EmpresaTab 
              config={empresaConfig}
              onChange={(updates: any) => setEmpresaConfig({ ...empresaConfig, ...updates })}
              onSave={handleSaveEmpresa}
              onLogoUpload={handleLogoUpload}
              loading={loading}
              logoInputRef={logoInputRef}
            />
          )}

          {/* Preferencias de Usuario */}
{/* Preferencias de Usuario */}
  </Box>
);
