import React from "react";

interface Props {
  // Add needed props per tab
}

export const ConfigTabCerebro: React.FC<Props> = () => {
  return (
          {activeTab === "cerebro" && (
            <CerebroAITab 
              reglasAI={reglasAI}
              onAddRegla={handleAddRegla}
              onDeleteRegla={handleDeleteRegla}
              promptsAI={promptsAI}
              onEditPrompt={(prompt: any) => {
                setEditingPrompt(prompt);
                setOpenPromptModal(true);
              }}
              conocimiento={conocimiento}
              onAddConocimiento={handleAddConocimiento}
              onDeleteConocimiento={handleDeleteConocimiento}
              onRefreshConocimiento={refreshConocimiento}
            />
          )}

          {/* Configuración de Plantillas */}
  );
};
