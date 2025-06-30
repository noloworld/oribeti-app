import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

interface Produto {
  nome: string;
  quantidade: string;
  preco: string;
}

interface DadosEncomenda {
  nomeDespesa: string;
  produtos: Produto[];
}

interface EmlUploaderProps {
  onDadosExtraidos: (dados: DadosEncomenda) => void;
  className?: string;
}

export default function EmlUploader({ onDadosExtraidos, className = "" }: EmlUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<DadosEncomenda | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função para extrair dados do HTML do e-mail da Boticário
  function extrairDadosBoticario(htmlContent: string): DadosEncomenda | null {
    try {
      console.log('🔍 Iniciando extração de dados...');
      console.log('📄 Conteúdo HTML (primeiros 500 chars):', htmlContent.substring(0, 500));
      
      // Criar um parser DOM
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Procurar por padrões comuns nos e-mails da Boticário
      const produtos: Produto[] = [];
      
             // Estratégia 1: Procurar tabelas com produtos
       const tables = doc.querySelectorAll('table');
       let produtosEncontrados = false;
       
       console.log(`📊 Encontradas ${tables.length} tabelas no HTML`);
       
       for (const table of tables) {
        const rows = table.querySelectorAll('tr');
        
        for (const row of rows) {
          const cells = row.querySelectorAll('td, th');
          
                     // Procurar por linhas que contenham informações de produtos
           if (cells.length >= 3) {
             const textos = Array.from(cells).map(cell => cell.textContent?.trim() || '');
             
             // Pular cabeçalhos
             if (textos.some(t => t.toLowerCase().includes('produto') || t.toLowerCase().includes('quantidade') || t.toLowerCase().includes('preço'))) {
               continue;
             }
             
             // Procurar padrões que indiquem produto, quantidade e preço
             const nomeMatch = textos.find(t => 
               t.length > 3 && 
               !t.match(/^\d+$/) && 
               !t.match(/^[€$]\d/) &&
               !t.toLowerCase().includes('total') &&
               !t.toLowerCase().includes('subtotal')
             );
             
             const quantidadeMatch = textos.find(t => t.match(/^\d+$/) && parseInt(t) > 0 && parseInt(t) < 100);
             
             // Procurar preços - preferir preços menores (unitários) sobre maiores (subtotais)
             const precosEncontrados = textos
               .filter(t => 
                 t.match(/[€$]\s*\d+[.,]\d{2}/) || 
                 t.match(/\d+[.,]\d{2}\s*[€$]/) ||
                 t.match(/^\d+[.,]\d{2}$/)
               )
               .map(t => ({
                 texto: t,
                 valor: parseFloat(t.replace(/[€$]/g, '').replace(/[^\d.,]/g, '').replace(',', '.'))
               }))
               .sort((a, b) => a.valor - b.valor); // Ordenar por valor crescente
             
             const precoMatch = precosEncontrados.length > 0 ? precosEncontrados[0].texto : null;
             
             if (nomeMatch && quantidadeMatch && precoMatch) {
               // Limpar o preço
               const precoLimpo = precoMatch
                 .replace(/[€$]/g, '')
                 .replace(/[^\d.,]/g, '')
                 .replace(',', '.')
                 .trim();
               
               if (parseFloat(precoLimpo) > 0) {
                 produtos.push({
                   nome: nomeMatch,
                   quantidade: quantidadeMatch,
                   preco: precoLimpo
                 });
                 produtosEncontrados = true;
               }
             }
          }
        }
      }
      
             // Estratégia 2: Procurar por padrões de texto se não encontrou na tabela
       if (!produtosEncontrados) {
         console.log('📝 Não encontrou produtos em tabelas, tentando parsing de texto...');
         const bodyText = doc.body?.textContent || htmlContent;
         
         console.log('📄 Texto do corpo (primeiros 500 chars):', bodyText.substring(0, 500));
         
         // Procurar por padrões como "Produto X - Qtd: Y - Preço: Z"
         const linhas = bodyText.split('\n');
        
        for (const linha of linhas) {
          const linhaTrim = linha.trim();
          
          // Padrões comuns de e-mails de encomenda
          const patterns = [
            /(.+?)\s*[-–]\s*(?:Qtd|Quantidade):\s*(\d+)\s*[-–]\s*(?:Preço|Valor):\s*[€$]?\s*(\d+[.,]\d{2})/i,
            /(.+?)\s*\|\s*(\d+)\s*\|\s*[€$]?\s*(\d+[.,]\d{2})/,
            /(.+?)\s*x\s*(\d+)\s*[€$]?\s*(\d+[.,]\d{2})/i
          ];
          
          for (const pattern of patterns) {
            const match = linhaTrim.match(pattern);
            if (match) {
              const [, nome, quantidade, preco] = match;
              const precoLimpo = preco.replace(',', '.');
              
              if (nome.length > 2 && parseFloat(precoLimpo) > 0) {
                produtos.push({
                  nome: nome.trim(),
                  quantidade: quantidade,
                  preco: precoLimpo
                });
              }
            }
          }
        }
      }
      
             // Estratégia 3: Fallback mais genérico se ainda não encontrou produtos
       if (produtos.length === 0) {
         console.log('🔄 Tentando estratégia genérica...');
         
         // Procurar por qualquer linha que contenha números e símbolos de moeda
         const todasLinhas = (doc.body?.textContent || htmlContent).split(/[\n\r]+/);
         
         for (const linha of todasLinhas) {
           const linhaTrim = linha.trim();
           if (linhaTrim.length < 5) continue;
           
           // Procurar padrões mais flexíveis
           const precoRegex = /(?:€|EUR|\$|USD)?\s*(\d+[.,]\d{2})\s*(?:€|EUR|\$|USD)?/g;
           const quantidadeRegex = /(?:qtd|quantidade|qty|x)\s*:?\s*(\d+)/gi;
           
           const precos = [...linhaTrim.matchAll(precoRegex)];
           const quantidades = [...linhaTrim.matchAll(quantidadeRegex)];
           
           if (precos.length > 0) {
             // Tentar extrair nome do produto (texto antes do primeiro número/preço)
             const textoAntes = linhaTrim.split(/\d/)[0].trim();
             if (textoAntes.length > 3) {
               const preco = precos[0][1].replace(',', '.');
               const quantidade = quantidades.length > 0 ? quantidades[0][1] : '1';
               
               produtos.push({
                 nome: textoAntes.replace(/[^\w\s]/g, '').trim(),
                 quantidade: quantidade,
                 preco: preco
               });
             }
           }
         }
       }
       
       console.log(`✅ Total de produtos encontrados: ${produtos.length}`);
       produtos.forEach((p, i) => {
         console.log(`📦 Produto ${i + 1}: ${p.nome} | Qtd: ${p.quantidade} | Preço: €${p.preco}`);
       });
       
       if (produtos.length === 0) {
         console.log('❌ Nenhum produto foi encontrado');
         return null;
       }
       
       // Remover duplicados
       const produtosUnicos = produtos.filter((produto, index, arr) => 
         arr.findIndex(p => p.nome === produto.nome) === index
       );
       
       // Se não conseguiu determinar se é da Boticário, usar nome genérico
       const nomeEmpresa = htmlContent.toLowerCase().includes('boticário') || htmlContent.toLowerCase().includes('boticario') 
         ? "Compra Boticário" 
         : "Compra Online";
       
       return {
         nomeDespesa: nomeEmpresa,
         produtos: produtosUnicos
       };
      
    } catch (error) {
      console.error('Erro ao extrair dados:', error);
      return null;
    }
  }

  // Função para processar o ficheiro .eml
  async function processarFicheiroEml(file: File): Promise<DadosEncomenda | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const conteudo = e.target?.result as string;
          
          console.log('📧 Processando ficheiro .eml...');
          console.log('📄 Tamanho do ficheiro:', conteudo.length, 'caracteres');
          
          // Procurar pelo conteúdo HTML no ficheiro .eml
          let htmlContent = '';
          
          // Estratégia 1: Procurar por Content-Type: text/html
          const linhas = conteudo.split('\n');
          let dentroHtml = false;
          let htmlLines: string[] = [];
          
          for (let i = 0; i < linhas.length; i++) {
            const linha = linhas[i];
            
            // Detectar início do conteúdo HTML
            if (linha.includes('Content-Type: text/html') || linha.includes('content-type: text/html')) {
              dentroHtml = true;
              // Pular cabeçalhos até encontrar linha vazia
              for (let j = i + 1; j < linhas.length; j++) {
                if (linhas[j].trim() === '') {
                  i = j;
                  break;
                }
              }
              continue;
            }
            
            // Detectar fim do conteúdo HTML (próximo boundary)
            if (dentroHtml && linha.includes('--') && linha.includes('boundary')) {
              break;
            }
            
            if (dentroHtml) {
              htmlLines.push(linha);
            }
          }
          
          htmlContent = htmlLines.join('\n');
          
          console.log('🔍 HTML extraído (Estratégia 1):', htmlContent.length, 'caracteres');
          
          // Estratégia 2: Se não encontrou HTML estruturado, procurar por tags HTML no conteúdo
          if (!htmlContent || htmlContent.length < 100) {
            console.log('🔄 Tentando Estratégia 2...');
            const htmlMatch = conteudo.match(/<html[\s\S]*<\/html>/i);
            if (htmlMatch) {
              htmlContent = htmlMatch[0];
              console.log('✅ Encontrou tag <html> completa');
            } else {
              // Estratégia 3: Procurar por qualquer conteúdo com tags HTML
              console.log('🔄 Tentando Estratégia 3...');
              const bodyMatch = conteudo.match(/<body[\s\S]*<\/body>/i);
              if (bodyMatch) {
                htmlContent = bodyMatch[0];
                console.log('✅ Encontrou tag <body>');
              } else {
                // Estratégia 4: Procurar por tabelas ou outros elementos HTML
                console.log('🔄 Tentando Estratégia 4...');
                if (conteudo.includes('<table') || conteudo.includes('<td')) {
                  htmlContent = conteudo;
                  console.log('✅ Encontrou elementos de tabela no conteúdo');
                } else {
                  // Estratégia 5: Usar texto simples se não encontrar HTML
                  console.log('🔄 Tentando Estratégia 5 (texto simples)...');
                  htmlContent = `<div>${conteudo}</div>`;
                }
              }
            }
          }
          
          if (!htmlContent) {
            resolve(null);
            return;
          }
          
          // Extrair dados do HTML
          const dados = extrairDadosBoticario(htmlContent);
          resolve(dados);
          
        } catch (error) {
          console.error('Erro ao processar ficheiro:', error);
          resolve(null);
        }
      };
      
      reader.onerror = () => {
        resolve(null);
      };
      
      reader.readAsText(file, 'utf-8');
    });
  }

  // Handler para upload do ficheiro
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Verificar extensão do ficheiro
    if (!file.name.toLowerCase().endsWith('.eml')) {
      toast.error('Por favor, selecione um ficheiro .eml');
      return;
    }
    
    setLoading(true);
    
    try {
      const dados = await processarFicheiroEml(file);
      
      if (!dados || dados.produtos.length === 0) {
        console.log('❌ Falha na extração de dados');
        toast.error('Não foi possível extrair dados do ficheiro .eml. Verifique a consola do navegador (F12) para mais detalhes. Certifique-se que o ficheiro contém uma tabela ou lista de produtos com preços.');
        return;
      }
      
      setPreviewData(dados);
      toast.success(`${dados.produtos.length} produto(s) encontrado(s)!`);
      
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar o ficheiro .eml');
    } finally {
      setLoading(false);
      // Limpar o input para permitir upload do mesmo ficheiro novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  // Aplicar dados extraídos ao formulário
  function aplicarDados() {
    if (previewData) {
      onDadosExtraidos(previewData);
      setPreviewData(null);
      toast.success('Dados aplicados ao formulário!');
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Botão de Upload */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".eml"
          onChange={handleFileUpload}
          className="hidden"
          id="eml-upload"
        />
        <label
          htmlFor="eml-upload"
          className={`
            inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 
            text-white rounded cursor-pointer transition-colors text-sm font-medium
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {loading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              A processar...
            </>
          ) : (
            <>
              📧 Carregar ficheiro .eml
            </>
          )}
        </label>
        <span className="text-xs text-gray-400">
          Carregue um e-mail da Boticário exportado como .eml
        </span>
      </div>

      {/* Preview dos dados extraídos */}
      {previewData && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-semibold text-green-400">Dados extraídos do e-mail:</h4>
            <button
              onClick={() => setPreviewData(null)}
              className="text-gray-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-gray-300 text-sm">Nome da despesa:</span>
              <div className="font-medium">{previewData.nomeDespesa}</div>
            </div>
            
            <div>
              <span className="text-gray-300 text-sm">Produtos encontrados ({previewData.produtos.length}):</span>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {previewData.produtos.map((produto, index) => (
                  <div key={index} className="bg-gray-700 rounded p-3 text-sm">
                    <div className="font-medium">{produto.nome}</div>
                    <div className="flex justify-between text-gray-300 mt-1">
                      <span>Quantidade: {produto.quantidade}</span>
                      <span>Preço: €{produto.preco}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-gray-600">
              <div className="text-sm text-gray-300">
                Total: €{previewData.produtos.reduce((total, p) => 
                  total + (parseInt(p.quantidade) * parseFloat(p.preco)), 0
                ).toFixed(2)}
              </div>
              <button
                onClick={aplicarDados}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
              >
                Aplicar ao Formulário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 