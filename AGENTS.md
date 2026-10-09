<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep CRM state and persistence in the shared CRM store, not in route components, so local-first storage can be replaced without rewriting the UI.
- Use TanStack file routes for each CRM view and keep shared navigation and dialogs in the root shell, so deep links and actions remain consistent.
- Keep the CRM shell in the authenticated layout, with public auth/recovery routes outside it and one root auth-state subscriber, so signed-out visitors never mount CRM content.
- Authentication does not migrate or erase the legacy shared browser CRM store; data synchronization and per-user ownership require a separate migration.
