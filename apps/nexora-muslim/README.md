# Nexora Muslim

Cross-platform Muslim super-app foundation built with Expo + React Native and intended to integrate with Nexora Core.

## Platforms

- Android
- iOS
- Web

## Product pillars

1. Quran reader and audio
2. Quran learning with Duolingo-style progression
3. Tajwid, Tahsin, Arabic and Kitab Kuning learning
4. Prayer, Qibla, Dhikr and Du'a
5. Hadith and curated Islamic knowledge
6. AI learning assistant with source-aware answers
7. Umrah/Hajj preparation and travel marketplace
8. Teacher/classes and learning communities
9. Charity, zakat and halal discovery
10. Muslim finance and family journey features

## Mobile structure

`mobile/app` uses Expo Router. The first shell contains Home, Quran, Learn, Travel and Profile tabs.

## Architecture direction

The mobile app should remain a client application. Identity, domain rules, payments, audit, RBAC and business workflows should integrate through Nexora Core/Django APIs. Firebase can provide authentication, notifications and selected realtime/mobile infrastructure through provider adapters.

## Development

From this directory:

```bash
pnpm install
pnpm start
```

Then use Expo to run Android, iOS, or web.

## Roadmap

- V1: Quran, prayer, Qibla, Dhikr, bookmarks, profile
- V2: gamified Quran/Tajwid/Arabic learning
- V3: Kitab Kuning, Hadith, Tafsir and courses
- V4: AI learning assistant
- V5: Umrah/Hajj journey and partner marketplace
- V6: community, family, charity, halal discovery and finance
