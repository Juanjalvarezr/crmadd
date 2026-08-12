import os
from dotenv import load_dotenv
from supabase import create_client
import asyncio

load_dotenv('.env')
url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_ANON_KEY')
supabase = create_client(url, key)

async def main():
    juan_resp = await supabase.from('clientes').select('id').eq('email', 'emprende.villavo@gmail.com').maybe_single().execute()
    juan = juan_resp.data
    if not juan:
        print('JUAN_JOSE_NO_ENCONTRADO')
        return
    juan_id = juan['id']
    print(f'Juan Jose ID: {juan_id}')
    
    docs_fake = await supabase.from('documentos').select('id, url').ilike('url', '%example.com%').execute()
    if docs_fake.data:
        for doc in docs_fake.data:
            await supabase.from('documentos').delete().eq('id', doc['id']).execute()
        print(f'Eliminados {len(docs_fake.data)} documentos con URLs fake')
    
    contratos_otros = await supabase.from('contratos').select('id').eq('cliente_id', 10).execute()
    if contratos_otros.data:
        for c in contratos_otros.data:
            await supabase.from('contratos').delete().eq('id', c['id']).execute()
        print(f'Eliminados {len(contratos_otros.data)} contratos de otro cliente')
    
    facturas_otros = await supabase.from('facturas').select('id').eq('cliente_id', 10).execute()
    if facturas_otros.data:
        for f in facturas_otros.data:
            await supabase.from('facturas').delete().eq('id', f['id']).execute()
        print(f'Eliminadas {len(facturas_otros.data)} facturas de otro cliente')
    
    proyectos_juan = await supabase.from('proyectos').select('id').eq('cliente_id', juan_id).execute()
    if proyectos_juan.data:
        pry_ids = [p['id'] for p in proyectos_juan.data]
        docs_sin = await supabase.from('documentos').select('id').or_(f'entidad_id.is.null,entidad_id.eq.PRY-2').execute()
        if docs_sin.data:
            for doc in docs_sin.data:
                await supabase.from('documentos').update({'entidad_id': pry_ids[0]}).eq('id', doc['id']).execute()
            print(f'Relacionados {len(docs_sin.data)} documentos a proyecto de Juan José')
    
    print('LIMPIEZA_COMPLETADA')

asyncio.run(main())
