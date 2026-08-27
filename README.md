# Cara ou Coroa

Uma moeda, uma sala branca infinita e um botão. Sem servidor, sem build, sem
dependência: HTML, CSS e JavaScript.

**[[Ver ao vivo →](https://maycristina.github.io/cara-ou-coroa/)](#)** &nbsp;·&nbsp;  

---

## O que tem de interessante aqui

A peça é 3D e **não usa biblioteca 3D**. A moeda é um objeto CSS: duas imagens
costa a costa com `backface-visibility`, e 16 discos empilhados em Z entre elas
formando a espessura. O movimento de câmera é composição de transformações no
contêiner — `perspective-origin` para inclinar o olhar, `translateZ` para
afastar, `rotateX` para terminar acima da moeda.

Três decisões que valem a leitura:

**O resultado é sorteado no clique, não lido do final da queda.** Simular física
com colisão seria não determinístico: a moeda pararia de canto, ou daria
resultado diferente conforme a taxa de quadros do aparelho. Aqui o giro total é
uma conta — um número inteiro de voltas mais o meio-giro que deixa a face certa
para cima. A física é aparência; o resultado é aritmética.

**A altura usa uma parábola normalizada**, `4u(1−u)`, e não gravidade real. Ela
vale 0 nas pontas e 1 no meio, o que garante o pouso em exatos 3,00 s seja qual
for a altura sorteada. Com `g` e velocidade iniciais reais, mudar a altura
mudaria a duração.

**O tempo vem do relógio, não de um contador.** Somar `delta` a cada quadro faz
a animação divergir entre 60 Hz e 120 Hz e derrapar quando a aba perde o foco.

## Estrutura

```
index.html          quatro camadas aninhadas, uma responsabilidade cada
css/style.css       a moeda, a sala, a interface
js/moeda.js         catálogo, linha do tempo, câmera
img/                4 arquivos WebP: <chave>-cara e <chave>-coroa
```

| Camada | Responsabilidade |
|---|---|
| `.sala` | a perspectiva — é a lente |
| `.rig` | o movimento de câmera |
| `.arco` | a posição da moeda no espaço |
| `.moeda` | só o giro |
| `.sombra` | irmã de `.arco`, não filha — fica no chão enquanto a moeda voa |

## Trocar as imagens

Só o conteúdo de `img/`. Especificação:

- **quadrado, fundo transparente**, moeda encostando nas quatro bordas
- 700 a 900 px de lado
- vista **de frente, sem perspectiva** — imagem inclinada fica torta ao
  ser mapeada num plano, porque a inclinação já está assada na imagem
- luz difusa, sem flash direto

Nomeie como `<chave>-cara.webp` e `<chave>-coroa.webp`.

A cor da borda de cada moeda fica no catálogo em `js/moeda.js`:

```js
var MOEDAS = {
  '25':  { nome: '25 centavos', canto: '#87785b' },
  '100': { nome: '1 real',      canto: '#9b7753' }
};
```

`canto` é a cor das fatias que formam a espessura.

Para acrescentar uma moeda, adicione a entrada e os dois arquivos. Nada mais muda.

## Ajustes rápidos

Em `css/style.css`:

| Variável | O que faz |
|---|---|
| `--raio` | tamanho da moeda em tela — é dele que o JavaScript deriva o resto |

Em `js/moeda.js`, no topo:

| Constante | O que faz |
|---|---|
| `RAZAO_ESPESSURA` | espessura como fração do raio. `0.055` é o padrão |
| `FATIAS` | discos que formam a borda; abaixo de 12 aparecem listras |

Em `js/moeda.js`: `RECUO`, `VOO` e `POUSO` são a linha do tempo em segundos, e
`CAMERA` é a trajetória — cinco chaves em tempo normalizado.

## Responsividade

O raio da moeda é `clamp(78px, min(27vw, 21vh), 190px)` — limitado por largura
**e** por altura ao mesmo tempo. Só `vw` estoura no celular deitado; só `vh`
estoura no monitor estreito.

Desse raio o JavaScript deriva tudo o mais: espessura, distância até o chão,
perspectiva, e a escala da trajetória de câmera — cujas chaves estão em
múltiplos do raio, não em pixels. A mesma coreografia serve para 78 px e 190 px.

Também tratados: `100dvh` (a barra de endereço do celular muda `100vh`),
`env(safe-area-inset-*)` para notch e barra inferior, alvo de toque de no mínimo
44 px, hover neutralizado onde o ponteiro é grosso, e remedição no `resize` e no
`orientationchange`.

## Acessibilidade

- **O resultado não aparece escrito na tela** — quem enxerga lê na própria moeda.
  Para leitor de tela existe um parágrafo invisível com `role="status"` e
  `aria-live`, que é o único jeito de a jogada ter resultado para quem não vê
- O placar é `aria-hidden`: o anúncio já informa a contagem, e sem isso o leitor
  de tela leria tudo duas vezes
- `prefers-reduced-motion` dispensa a coreografia e vai direto ao resultado:
  movimento de câmera é gatilho vestibular real
- Botão nativo, foco visível, Espaço e Enter

## Rodar

Abra o `index.html`. É isso — não há build nem servidor.

Para publicar: GitHub Pages apontando para a branch principal.

## Créditos e licença

Código sob licença MIT — ver [`LICENSE`](LICENSE).

As imagens em `img/` são **experimentais, geradas por IA**. Não são fotografias
autorais. Se for reaproveitar o código, use suas próprias imagens.
