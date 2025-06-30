# 📧 Upload de Ficheiros .EML da Boticário

## Como Usar

### 1. Exportar E-mail da Boticário
1. Abra o e-mail de confirmação de encomenda da Boticário no seu cliente de e-mail
2. **Gmail**: Clique nos 3 pontos → "Descarregar mensagem" → salve como `.eml`
3. **Outlook**: Clique com botão direito no e-mail → "Guardar como" → escolha formato `.eml`
4. **Apple Mail**: Arrastar o e-mail para o desktop ou usar "Guardar como"

### 2. Fazer Upload no Sistema
1. Acesse **Dashboard → Despesas**
2. Clique em **"Acrescentar nova despesa"**
3. Na secção **"Importar da Boticário"**, clique em **"📧 Carregar ficheiro .eml"**
4. Selecione o ficheiro `.eml` exportado
5. Aguarde o processamento (alguns segundos)

### 3. Revisar e Confirmar
1. O sistema mostrará uma **pré-visualização** dos dados extraídos:
   - Nome da despesa: "Compra Boticário"
   - Lista de produtos com quantidades e preços
   - Valor total calculado
2. Clique em **"Aplicar ao Formulário"** para preencher automaticamente
3. Revise os dados preenchidos
4. Clique em **"Guardar Despesa"**

## ✅ Formatos Suportados

### E-mails que Funcionam:
- ✅ E-mails de confirmação de encomenda da Boticário
- ✅ Tabelas HTML com produtos, quantidades e preços
- ✅ Formatos de preço: `€45,90`, `45.90€`, `45,90`, `$45.90`
- ✅ E-mails multipart (texto + HTML)

### Estruturas Reconhecidas:
```html
<table>
  <tr>
    <td>Nome do Produto</td>
    <td>2</td>
    <td>€15,50</td>
  </tr>
</table>
```

Ou formato de texto:
```
Produto X - Qtd: 2 - Preço: €15,50
Produto Y | 1 | €25,90
Produto Z x 3 €10,00
```

## 🔧 Resolução de Problemas

### "Não foi possível extrair dados"
- ✅ Verifique se é um e-mail da Boticário
- ✅ Confirme que contém uma tabela ou lista de produtos
- ✅ Certifique-se que o ficheiro tem extensão `.eml`

### Produtos não encontrados
- ✅ O e-mail deve ter quantidades numéricas (1, 2, 3...)
- ✅ Preços devem estar em formato monetário (€XX,XX)
- ✅ Nomes de produtos devem ter mais de 3 caracteres

### Preços incorrectos
- ✅ O sistema prefere preços unitários sobre subtotais
- ✅ Verifique se a tabela tem colunas separadas para preço unitário e subtotal

## 💡 Dicas

1. **Teste primeiro**: Use o ficheiro de exemplo `exemplo_boticario.eml` para testar
2. **Revise sempre**: Confirme os dados antes de guardar
3. **Edite se necessário**: Pode ajustar produtos manualmente após importar
4. **Múltiplos ficheiros**: Pode importar vários e-mails como despesas separadas

## 🚀 Funcionalidades

- **Processamento Frontend**: Tudo funciona no navegador, sem envio para servidor
- **Múltiplos Formatos**: Suporta diferentes layouts de e-mail
- **Pré-visualização**: Mostra dados extraídos antes de aplicar
- **Limpeza Automática**: Remove duplicados e formata preços
- **Responsivo**: Funciona em desktop e mobile

---

**Nota**: Esta funcionalidade foi desenvolvida especificamente para e-mails da Boticário. Para outros fornecedores, pode ser necessário ajustar os padrões de extração. 