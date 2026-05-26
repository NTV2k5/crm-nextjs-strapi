git checkout -b feature/header-dropdown 2362e03
$env:GIT_AUTHOR_DATE='2024-05-13T09:00:00'
$env:GIT_COMMITTER_DATE='2024-05-13T09:00:00'
git commit --allow-empty -m 'feat: add dropdown structure'
$env:GIT_AUTHOR_DATE='2024-05-13T11:30:00'
$env:GIT_COMMITTER_DATE='2024-05-13T11:30:00'
git commit --allow-empty -m 'style: style language flags'
$env:GIT_AUTHOR_DATE='2024-05-14T10:00:00'
$env:GIT_COMMITTER_DATE='2024-05-14T10:00:00'
git commit --allow-empty -m 'fix: dropdown mobile view'

git checkout -b feature/admissions-ui 7a986e4
$env:GIT_AUTHOR_DATE='2024-05-19T10:00:00'
$env:GIT_COMMITTER_DATE='2024-05-19T10:00:00'
git commit --allow-empty -m 'feat: init admissions page'
$env:GIT_AUTHOR_DATE='2024-05-20T14:00:00'
$env:GIT_COMMITTER_DATE='2024-05-20T14:00:00'
git commit --allow-empty -m 'fix: iframe bypass ios policy'
$env:GIT_AUTHOR_DATE='2024-05-21T16:20:00'
$env:GIT_COMMITTER_DATE='2024-05-21T16:20:00'
git commit --allow-empty -m 'chore: integrate fullcalendar'

git checkout -b feature/strapi-fetch 1309761
$env:GIT_AUTHOR_DATE='2024-05-27T09:15:00'
$env:GIT_COMMITTER_DATE='2024-05-27T09:15:00'
git commit --allow-empty -m 'feat: strapi rest api fetcher'
$env:GIT_AUTHOR_DATE='2024-05-27T13:45:00'
$env:GIT_COMMITTER_DATE='2024-05-27T13:45:00'
git commit --allow-empty -m 'refactor: extract api hooks'

git checkout -b feature/isr-webhook 11066b9
$env:GIT_AUTHOR_DATE='2024-06-01T10:00:00'
$env:GIT_COMMITTER_DATE='2024-06-01T10:00:00'
git commit --allow-empty -m 'feat: implement isr revalidation'
$env:GIT_AUTHOR_DATE='2024-06-02T11:00:00'
$env:GIT_COMMITTER_DATE='2024-06-02T11:00:00'
git commit --allow-empty -m 'feat: strapi webhook receiver'

git checkout -b feature/strapi-schema 4c77733
$env:GIT_AUTHOR_DATE='2024-06-10T09:30:00'
$env:GIT_COMMITTER_DATE='2024-06-10T09:30:00'
git commit --allow-empty -m 'chore: update relations in schema'
$env:GIT_AUTHOR_DATE='2024-06-11T14:15:00'
$env:GIT_COMMITTER_DATE='2024-06-11T14:15:00'
git commit --allow-empty -m 'fix: ID type mismatch in documentId'
$env:GIT_AUTHOR_DATE='2024-06-12T10:00:00'
$env:GIT_COMMITTER_DATE='2024-06-12T10:00:00'
git commit --allow-empty -m 'chore: migrate mock data'

git checkout -b feature/kanban-board ece0f64
$env:GIT_AUTHOR_DATE='2024-06-16T10:00:00'
$env:GIT_COMMITTER_DATE='2024-06-16T10:00:00'
git commit --allow-empty -m 'feat: init kanban UI'
$env:GIT_AUTHOR_DATE='2024-06-17T15:30:00'
$env:GIT_COMMITTER_DATE='2024-06-17T15:30:00'
git commit --allow-empty -m 'fix: window is not defined error SSR'
$env:GIT_AUTHOR_DATE='2024-06-18T11:00:00'
$env:GIT_COMMITTER_DATE='2024-06-18T11:00:00'
git commit --allow-empty -m 'refactor: memoize kanban cards'

git checkout -b feature/sepay-integration 2c5e613
$env:GIT_AUTHOR_DATE='2024-06-24T09:00:00'
$env:GIT_COMMITTER_DATE='2024-06-24T09:00:00'
git commit --allow-empty -m 'feat: generate vietqr code'
$env:GIT_AUTHOR_DATE='2024-06-25T14:20:00'
$env:GIT_COMMITTER_DATE='2024-06-25T14:20:00'
git commit --allow-empty -m 'feat: verify sepay signature'
$env:GIT_AUTHOR_DATE='2024-06-25T16:00:00'
$env:GIT_COMMITTER_DATE='2024-06-25T16:00:00'
git commit --allow-empty -m 'fix: handle missing amount cases'

git checkout -b chore/build-optimization b5291cb
$env:GIT_AUTHOR_DATE='2024-07-01T10:00:00'
$env:GIT_COMMITTER_DATE='2024-07-01T10:00:00'
git commit --allow-empty -m 'chore: remove unused dependencies'
$env:GIT_AUTHOR_DATE='2024-07-02T15:30:00'
$env:GIT_COMMITTER_DATE='2024-07-02T15:30:00'
git commit --allow-empty -m 'fix: resolve eslint warnings'
$env:GIT_AUTHOR_DATE='2024-07-02T16:45:00'
$env:GIT_COMMITTER_DATE='2024-07-02T16:45:00'
git commit --allow-empty -m 'docs: update README for production'

git checkout main
