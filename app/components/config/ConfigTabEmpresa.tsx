import React from "react";

interface Props {
  // Add needed props per tab
}

export const ConfigTabEmpresa: React.FC<Props> = () => {
  return (
          {activeTab === "empresa" && (
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
  );
};
