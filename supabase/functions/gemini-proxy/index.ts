// supabase/functions/gemini-proxy/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
};

serve(async (req) => {
  // Manejo de peticiones CORS preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Falta la API Key GEMINI_API_KEY en los secretos de Supabase.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, text, prompt, model = 'gemini-3.8-flash' } = body;

    // 1. Acción de generar embeddings
    if (action === 'embedText') {
      if (!text) {
        return new Response(
          JSON.stringify({ error: 'El campo "text" es requerido para generar embeddings.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text }] },
          }),
        }
      );
      
      const data = await response.json();
      
      if (data.error) {
        return new Response(
          JSON.stringify({ error: data.error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ embedding: data.embedding?.values || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1b. Vision: extraer datos de tarjeta
    if (action === 'extractCard') {
      const { imageBase64, mimeType = 'image/jpeg' } = body;
      if (!imageBase64) {
        return new Response(JSON.stringify({ error: 'El campo imageBase64 es requerido.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const prompt = [
        'Analiza la imagen de esta tarjeta de presentacion y devuelve SOLO un JSON valido.',
        'Formato: {"nombre":"","empresa":"","telefono":"","whatsapp":"","email":"","direccion":"","web":"","redes":[],"texto":""}',
        'Reglas: sin explicaciones, sin markdown, solo el JSON. Si un dato no aparece, dejalo vacio.',
      ].join('\n');
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ parts: [ { text: prompt }, { inlineData: { mimeType, data: imageBase64 } } ] }] }),
      });
      const data = await response.json();
      if (data.error) { return new Response(JSON.stringify({ error: data.error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      let parsed = {};
      try {
        const bt = String.fromCharCode(96);
        const cleaned = raw.split(bt + bt + bt + 'json').join('').split(bt + bt + bt).join('').trim();
        const a = cleaned.indexOf('{'); const b = cleaned.lastIndexOf('}');
        parsed = a >= 0 && b > a ? JSON.parse(cleaned.slice(a, b + 1)) : {};
      } catch { parsed = { texto: raw }; }
      return new Response(JSON.stringify({ data: parsed }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Acción de generar contenido de texto (por defecto)
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'El campo "prompt" es requerido para generar contenido.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    
    if (data.error) {
      return new Response(
        JSON.stringify({ error: data.error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return new Response(
      JSON.stringify({ text: responseText }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
