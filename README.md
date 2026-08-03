# Saúde ao Seu Alcance — Portal (Angular)

Recriação em Angular da Home do portal de saúde "Saúde ao Seu Alcance" (SaSA), a partir do arquivo Figma anexado. Standalone components, signals, SCSS por componente, dados via `HttpClient` lendo JSONs mock que simulam a API.

## Rodando localmente

```bash
npm install
npm start   # ng serve — http://localhost:4200
```

## Estrutura

```
src/app/
  core/
    models/       interfaces TS dos dados (nav, home, footer)
    services/      NavigationService, HomeService, FooterService — HttpClient lendo assets/mock/*.json
  shared/
    components/    Button, Icon (glifos simples em SVG), CategoryCard, StatCard, NewsletterForm
    layout/        Header (com mega menu) e Footer, usados no AppComponent (fora do router-outlet)
  features/
    home/          HomeComponent + subcomponentes de seção (hero, trending, health-data, sponsored)
src/assets/
  mock/            navigation.json, home.json, footer.json — formato que a API deverá retornar
  images/          fotos reais extraídas do Figma (cuidado-com-a-saude.jpg, nutricao.jpg, outubro-rosa.png)
```

## Escopo desta primeira entrega

Só a Home foi construída. O Figma tem mais telas (Blog, Criar conta, Quem somos, Sobre o portal, Página interna, Linha editorial, Busca) — a mesma biblioteca de componentes (`shared/`) foi pensada para ser reaproveitada nelas.

## Plugando a API real

Cada serviço em `core/services` tem um único ponto de troca — o `endpoint`:

```ts
private readonly endpoint = 'assets/mock/home.json';
// vira, por exemplo:
private readonly endpoint = `${environment.apiBaseUrl}/home`;
```

Os modelos em `core/models` já descrevem o contrato esperado; a API real só precisa devolver o mesmo formato (ou um adapter na service faz o `map()`).

## Cards sem foto

Vários cards da Home (`Cuidado Federal`, `Dasa`, `Hospital São José`, `PBH`) estão sem imagem no Figma original — o `CategoryCardComponent` mostra um placeholder listrado com o nome do que deve entrar ali; basta preencher `image` no JSON (ou na resposta da API) quando a foto estiver disponível.
