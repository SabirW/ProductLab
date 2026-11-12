# ProductLab: shared workspace plan

## Purpose

Three friends use ProductLab from their own devices. Each person signs into a personal account and uses a shared space for ideas and conversation.

## Private to each account

- Products, including store and social account links
- Analytics and imported sales data
- Ad campaigns and tests
- Store links and product follow-up
- Custom sections and their posts

Each request for private data must verify the signed-in account on the server. Hiding a section in the browser is not access control.

## Shared within the group

- Winner concepts and their links
- Prompts, screenshots, and related content
- Group chat

Only authenticated group members can read or write shared content. The three-person group is private; public sign-up is not required.

## Existing data

The current prototype stores data only in a browser. Keep it intact. Provide an explicit reviewable import into a chosen signed-in account and shared workspace; never silently upload or overwrite existing data. Shared prompts and screenshots must be clearly identified before import.

## Practical build order

1. Select deployment and authentication service, create private group and sign-in.
2. Add a database with per-account authorization. Verify one account cannot read or change another account's records.
3. Move private product, analytics, campaign, store, follow-up and custom-section data behind the authorization boundary.
4. Add group-scoped winner concepts and prompts, including controlled screenshot storage.
5. Add a group chat, with sender and time, and protect access to messages.
6. Add import, backup, and tests covering ownership, shared access, and image uploads.

## Security and operational requirements

- Passwords and session handling use a maintained authentication service or established library.
- All private and shared operations enforce authorization on the server or in database policies.
- Use HTTPS for online use. Limit uploads by size and supported type.
- Chat and all text render as text, not executable HTML.
- No claim of privacy or online sync until access checks are tested.
- Keep hosting credentials and secrets outside the repository.

## Open decisions

- Where the app will be hosted and which authentication/database service it will use.
- How the three members will be invited and whether members can invite others.
- Whether current browser data will be imported; if so, which shared content the user chooses to share.
