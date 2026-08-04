# 0003 — TTS gerado uma vez e cacheado no Storage

**Data**: 2026-05-29
**Status**: Aceito

## Contexto

O produto requer áudio falado em quase todo bloco de conteúdo: textos de leitura, vocabulário, diálogos, frases de exemplo. Gravar manualmente é inviável (custo de tempo, dificuldade de manter consistência, retrabalho a cada correção textual). TTS resolve, mas chamar API a cada reprodução é caro e lento.

O Google Cloud TTS Neural2 cobra cerca de USD 16 por milhão de caracteres. Mesmo um único curso completo (80 lições, ~160k caracteres) custa apenas USD 2-3 para gerar todas as vozes uma única vez.

## Alternativas consideradas

### Alternativa A: chamar TTS a cada reprodução
A cada vez que o aluno aperta play, a API é chamada.

**Contras**: latência (1-3s por chamada), custo proporcional ao uso (não ao conteúdo).

### Alternativa B (escolhida): cache permanente no Supabase Storage
Cada combinação `(texto + voz + sotaque)` gera UM arquivo MP3, salvo no Storage com chave determinística (`tts/{sha256(texto+voz+sotaque)}.mp3`). Acessos subsequentes servem direto do Storage.

**Prós**:
- Custo de TTS aproximadamente zero em regime estável (paga só o "novo").
- Latência: arquivo do Storage carrega em milissegundos.
- Mudanças de texto invalidam apenas os áudios afetados (hash muda).

**Contras**:
- Storage cresce com o catálogo. Estimativa: 160k caracteres × 4 vozes × ~100 bytes/char de MP3 = ~64 MB por curso. Desprezível.

## Decisão

Adotamos cache permanente no Storage com chave determinística por hash.

## Implementação

1. **Edge Function** `tts/generate` recebe `{ text, voice, accent }`.
2. Calcula `hash = sha256(text + voice + accent)`.
3. Se `tts/{hash}.mp3` existe no Storage, retorna URL pública.
4. Se não existe, chama Google TTS, salva no Storage, retorna URL.
5. **Client** sempre chama a Edge Function — nunca conhece se foi cache ou geração.

## Consequências

- `package.json` ganha dependência: `@google-cloud/text-to-speech`.
- Variável `GOOGLE_TTS_CREDENTIALS_JSON` em produção e local (para testar geração).
- Edge Function tem timeout maior para casos de geração (Google TTS pode levar até 5s).
- Limite do Storage do plano free do Supabase (1GB) é suficiente para vários cursos. Monitorar.
- Política de Storage permite leitura pública mas escrita apenas via service role.