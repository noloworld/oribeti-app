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
      
      if (!htmlContent || htmlContent.length === 0) {
        console.log('❌ HTML Content está vazio');
        return null;
      }
      
      // Criar um parser DOM
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Procurar por padrões específicos do e-mail da Boticário
      const produtos: Produto[] = [];
      
      // Estratégia específica para o formato Boticário que vimos no EML
      console.log('🎯 Usando estratégia específica para Boticário...');
      
      // Filtrar apenas a seção relevante do HTML (após "Detalhes da Encomenda")
      let secaoDetalhes = null;
      
      // Tentar diferentes variações do texto
      const variacoes = [
        'Detalhes da Encomenda',
        'Detalhes da encomenda', 
        'DETALHES DA ENCOMENDA',
        'detalhes da encomenda',
        'Detalhes&nbsp;da&nbsp;Encomenda',
        'Detalhes&#160;da&#160;Encomenda'
      ];
      
      for (const variacao of variacoes) {
        if (htmlContent.includes(variacao)) {
          secaoDetalhes = htmlContent.split(variacao)[1];
          console.log('✅ Encontrada seção:', variacao);
          break;
        }
      }
      
      if (!secaoDetalhes) {
        console.log('❌ Seção "Detalhes da Encomenda" não encontrada em nenhuma variação');
        console.log('📄 Conteúdo HTML disponível (primeiros 1000 chars):', htmlContent.substring(0, 1000));
        
        // Tentar procurar por qualquer tabela com produtos
        if (htmlContent.includes('<table') && (htmlContent.includes('Produto') || htmlContent.includes('produto'))) {
          console.log('🔍 Encontrou tabela com "Produto" - usando todo o conteúdo HTML');
          secaoDetalhes = htmlContent;
        }
      }
      
      if (secaoDetalhes) {
        console.log('✅ Seção "Detalhes da Encomenda" encontrada');
        
        // Regex mais específica para extrair produtos da tabela
        // Formato: Código | Quantidade | Produto | Tipo | Valor Unit. | Total
        const produtoRegex = /<tr[^>]*class="Q_dadosItem[^"]*"[^>]*>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>(\d+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>Venda<\/td>[\s\S]*?<td[^>]*>([\d,]+)<\/td>[\s\S]*?<td[^>]*>([\d,]+)<\/td>[\s\S]*?<\/tr>/gi;
        
        let match;
        while ((match = produtoRegex.exec(secaoDetalhes)) !== null) {
          const codigo = match[1].replace(/&nbsp;/g, ' ').trim();
          const quantidade = match[2];
          const nome = match[3].trim();
          const precoUnitario = match[4].replace(',', '.');
          const precoTotal = match[5].replace(',', '.');
          
          // Filtrar produtos válidos (excluir texto de cabeçalhos, criptografia, etc.)
                       if (nome && 
                 nome.length > 5 && 
                 !nome.includes('cipher') && 
                 !nome.includes('TLS') && 
                 !nome.includes('AES') && 
                 !nome.includes('RSA') &&
                 !nome.includes('ECDHE') &&
                 parseFloat(precoUnitario) > 0) {
               
               // Limpar entidades HTML e caracteres especiais
               const nomeLimpo = nome
                 .replace(/&nbsp;/g, ' ')
                 .replace(/&amp;/g, '&')
                 .replace(/&lt;/g, '<')
                 .replace(/&gt;/g, '>')
                 .replace(/&quot;/g, '"')
                 .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
                 .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
                 .trim();
               
               produtos.push({
                 nome: nomeLimpo,
                 quantidade: quantidade,
                 preco: precoUnitario
               });
            
            console.log(`📦 Produto encontrado: ${nome} | Qtd: ${quantidade} | Preço: €${precoUnitario}`);
          }
        }
        
        // Se a regex específica não funcionou, tentar uma mais simples
        if (produtos.length === 0) {
          console.log('🔄 Regex específica não encontrou produtos, tentando regex alternativa...');
          
          // Regex mais simples para linhas de tabela com 6 colunas
          const regexAlternativa = /<td[^>]*>(\d+(?:&nbsp;)*\d*)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>Venda<\/td>\s*<td[^>]*>([\d,]+)<\/td>\s*<td[^>]*>([\d,]+)<\/td>/gi;
          
          while ((match = regexAlternativa.exec(secaoDetalhes)) !== null) {
            const codigo = match[1].replace(/&nbsp;/g, ' ').trim();
            const quantidade = match[2];
            const nome = match[3].trim();
            const precoUnitario = match[4].replace(',', '.');
            const precoTotal = match[5].replace(',', '.');
            
            // Filtrar produtos válidos
            if (nome && 
                nome.length > 5 && 
                !nome.includes('cipher') && 
                !nome.includes('TLS') && 
                !nome.includes('AES') && 
                !nome.includes('RSA') &&
                !nome.includes('ECDHE') &&
                parseFloat(precoUnitario) > 0) {
              
              // Limpar entidades HTML e caracteres especiais
              const nomeLimpo = nome
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
                .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
                .trim();
              
              produtos.push({
                nome: nomeLimpo,
                quantidade: quantidade,
                preco: precoUnitario
              });
              
              console.log(`📦 Produto alternativo: ${nome} | Qtd: ${quantidade} | Preço: €${precoUnitario}`);
            }
          }
        }
      }
      
      // Estratégia de fallback mais rigorosa: Procurar apenas na seção de produtos
      if (produtos.length === 0) {
        console.log('📝 Não encontrou produtos com regex, tentando parsing rigoroso de texto...');
        
        // Procurar apenas na seção de detalhes da encomenda
        const secaoDetalhes = htmlContent.split('Detalhes da Encomenda')[1];
        if (secaoDetalhes) {
          // Remover HTML tags para análise de texto puro
          const textoLimpo = secaoDetalhes.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
          const linhas = textoLimpo.split(/(?:\n|\r\n|\r)/);
          
          console.log('📄 Analisando texto da seção de produtos...');
          
          for (const linha of linhas) {
            const linhaTrim = linha.trim();
            
            // Procurar linhas que tenham formato: Código Quantidade Produto Venda Preço Preço
            // Ex: "47 321 1 Sérum de Alta Potência Ácido Mandélico + Tranexâmico 5% Botik 30ml Venda 14,69 14,69"
            const match = linhaTrim.match(/^(\d+\s*\d*)\s+(\d+)\s+(.+?)\s+Venda\s+([\d,]+)\s+([\d,]+)$/);
            
            if (match) {
              const codigo = match[1].trim();
              const quantidade = match[2];
              const nome = match[3].trim();
              const precoUnitario = match[4].replace(',', '.');
              const precoTotal = match[5].replace(',', '.');
              
              // Filtrar produtos válidos
                             if (nome && 
                   nome.length > 10 && 
                   !nome.includes('cipher') && 
                   !nome.includes('TLS') && 
                   !nome.includes('AES') && 
                   !nome.includes('RSA') &&
                   !nome.includes('ECDHE') &&
                   parseFloat(precoUnitario) > 0) {
                 
                 // Limpar entidades HTML e caracteres especiais
                 const nomeLimpo = nome
                   .replace(/&nbsp;/g, ' ')
                   .replace(/&amp;/g, '&')
                   .replace(/&lt;/g, '<')
                   .replace(/&gt;/g, '>')
                   .replace(/&quot;/g, '"')
                   .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
                   .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
                   .trim();
                 
                 produtos.push({
                   nome: nomeLimpo,
                   quantidade: quantidade,
                   preco: precoUnitario
                 });
                
                console.log(`📦 Produto texto: ${nome} | Qtd: ${quantidade} | Preço: €${precoUnitario}`);
              }
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
    console.log('📧 Iniciando processamento do ficheiro EML...');
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        console.log('📖 FileReader.onload executado');
        try {
          const conteudo = e.target?.result as string;
          console.log('📄 Conteúdo lido, tamanho:', conteudo?.length || 0, 'caracteres');
          
          console.log('📧 Processando ficheiro .eml...');
          console.log('📄 Tamanho do ficheiro:', conteudo.length, 'caracteres');
          
          // Procurar pelo conteúdo HTML no ficheiro .eml
          let htmlContent = '';
          
          // Estratégia 1: Procurar por conteúdo base64 (específico para Boticário)
          const linhas = conteudo.split(/\r?\n/);
          let dentroBase64 = false;
          let base64Lines: string[] = [];
          let encontrouContentType = false;
          
          console.log('🔍 Analisando', linhas.length, 'linhas do ficheiro EML...');
          
          for (let i = 0; i < linhas.length; i++) {
            const linha = linhas[i].trim();
            
            // Detectar Content-Type: text/html
            if (linha.toLowerCase().includes('content-type:') && linha.toLowerCase().includes('text/html')) {
              encontrouContentType = true;
              console.log('✅ Encontrado Content-Type: text/html na linha', i + 1);
            }
            
            // Detectar início do conteúdo base64
            if (linha.toLowerCase().includes('content-transfer-encoding: base64')) {
              dentroBase64 = true;
              console.log('✅ Encontrado Content-Transfer-Encoding: base64 na linha', i + 1);
              
              // Pular cabeçalhos até encontrar linha vazia
              for (let j = i + 1; j < linhas.length; j++) {
                if (linhas[j].trim() === '') {
                  i = j;
                  console.log('📍 Iniciando coleta de base64 na linha', j + 1);
                  break;
                }
              }
              continue;
            }
            
            // Se estamos dentro do base64, coletar linhas
            if (dentroBase64) {
              // Verificar se a linha parece base64 (só letras, números, +, /, =)
              if (linha.match(/^[A-Za-z0-9+/=\s]*$/) && linha.length > 0) {
                base64Lines.push(linha);
              } else if (linha === '') {
                // Linha vazia, continuar
                continue;
              } else if (linha.startsWith('--') || linha.includes('boundary')) {
                // Encontrou boundary, parar
                console.log('📍 Encontrou boundary na linha', i + 1, '- parando coleta de base64');
                break;
              }
            }
          }
          
          console.log('📊 Base64 coletado:', base64Lines.length, 'linhas');
          
          if (base64Lines.length > 0) {
            try {
              const base64Content = base64Lines.join('').replace(/\s/g, '');
              console.log('🔍 Tentando decodificar', base64Content.length, 'caracteres de base64...');
              
              // Decodificar base64 e converter para UTF-8 corretamente
              const binaryString = atob(base64Content);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              // Usar TextDecoder para decodificar UTF-8 corretamente
              const decoder = new TextDecoder('utf-8');
              htmlContent = decoder.decode(bytes);
              
              console.log('✅ Base64 decodificado com UTF-8, tamanho:', htmlContent.length, 'caracteres');
              
              // Verificar se o conteúdo decodificado contém HTML
              if (htmlContent.includes('<html') || htmlContent.includes('<table') || htmlContent.includes('Detalhes da Encomenda')) {
                console.log('✅ Conteúdo HTML válido encontrado após decodificação');
              } else {
                console.log('⚠️ Conteúdo decodificado não parece ser HTML válido');
                console.log('📄 Primeiros 200 chars do conteúdo decodificado:', htmlContent.substring(0, 200));
              }
            } catch (error) {
              console.error('❌ Erro ao decodificar base64:', error);
              htmlContent = '';
            }
          }
          
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
      
      reader.onerror = (error) => {
        console.error('💥 Erro no FileReader:', error);
        resolve(null);
      };
      
      console.log('📚 Tentando ler ficheiro com UTF-8...');
      reader.readAsText(file, 'utf-8');
    });
  }

  // Handler para upload do ficheiro
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    console.log('🚀 Iniciando upload do ficheiro...');
    
    const file = event.target.files?.[0];
    if (!file) {
      console.log('❌ Nenhum ficheiro selecionado');
      return;
    }
    
    console.log('📁 Ficheiro selecionado:', file.name, 'Tamanho:', file.size, 'bytes');
    
    // Verificar extensão do ficheiro
    if (!file.name.toLowerCase().endsWith('.eml')) {
      console.log('❌ Extensão inválida:', file.name);
      toast.error('Por favor, selecione um ficheiro .eml');
      return;
    }
    
    console.log('✅ Extensão válida, iniciando processamento...');
    setLoading(true);
    
    try {
      console.log('🔄 Chamando processarFicheiroEml...');
      const dados = await processarFicheiroEml(file);
      console.log('📊 Dados retornados:', dados);
      
      if (!dados || dados.produtos.length === 0) {
        console.log('❌ Falha na extração de dados');
        toast.error('Não foi possível extrair dados do ficheiro .eml. Verifique a consola do navegador (F12) para mais detalhes. Certifique-se que o ficheiro contém uma tabela ou lista de produtos com preços.');
        return;
      }
      
      console.log('✅ Dados extraídos com sucesso:', dados.produtos.length, 'produtos');
      setPreviewData(dados);
      toast.success(`${dados.produtos.length} produto(s) encontrado(s)!`);
      
            } catch (error) {
          console.error('💥 Erro no handleFileUpload:', error);
          console.error('💥 Stack trace:', error instanceof Error ? error.stack : 'Stack não disponível');
          toast.error('Erro ao processar o ficheiro .eml');
        } finally {
      console.log('🏁 Finalizando upload...');
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