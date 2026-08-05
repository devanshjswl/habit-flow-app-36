# Remix of Continuum

## Project Overview

DailyMint is a mobile-first habit tracker application that enables users to build and maintain daily routines through streak tracking, progress visualization, and personal accountability. The product prioritizes simplicity, speed, and visual feedback over social features or premium gatekeeping. The target user is a self-motivated individual aged 18-45 seeking a distraction-free tool to monitor habit consistency and celebrate personal progress.

## Core Functionality

- **Habit Creation & Management**: Users can create, edit, and delete habits with custom names, descriptions, and daily/weekly frequency options

- **Daily Logging**: Quick one-tap check-in to mark habits as complete for the current day

- **Streak Tracking**: Automatic streak counter that increments on consecutive completions and resets on missed days

- **Progress Visualization**: Calendar heatmap showing completion history, streak badges, and visual momentum indicators

- **Habit Statistics**: Simple metrics including current streak, longest streak, completion percentage, and total completions

- **Reminders**: Optional push notifications at user-defined times to prompt habit completion

- **Data Persistence**: Secure local and cloud storage of habit data with automatic sync

## User Journey

1. **Onboarding**: User signs up with email or social auth, completes a brief tutorial on core features, and is prompted to add their first habit

2. **Habit Setup**: User creates 1-3 initial habits with names, descriptions, and reminder times

3. **Daily Engagement**: User opens app, sees today's habits, taps to log completions, and views updated streak counter

4. **Progress Review**: User navigates to calendar view to see weekly/monthly completion patterns and celebrate milestones

5. **Habit Refinement**: User adjusts habits, adds new ones, or archives completed goals based on progress insights

6. **Long-term Tracking**: User returns regularly to maintain streaks, view historical data, and build confidence through visual progress

## Technical Requirements

- **Platform**: iOS (primary), Android (secondary), responsive web app (future)

- **Frontend**: React Native or Flutter for cross-platform mobile development

- **Backend**: Node.js/Express or Python/Django REST API

- **Database**: PostgreSQL for relational data, Redis for caching and real-time features

- **Authentication**: JWT-based auth with email/password and OAuth 2.0 (Google, Apple)

- **Storage**: Cloud storage (AWS S3) for backups; local SQLite for offline access

- **Performance**: Target <2s load time, <500ms API response time, offline-first architecture

- **Security**: End-to-end encryption for sensitive data, GDPR/CCPA compliance, regular security audits

## API Integrations

- **Push Notification Service**: Firebase Cloud Messaging (FCM) for reminders and motivational notifications

- **Analytics**: Mixpanel or Amplitude for user behavior tracking and feature usage insights

- **Authentication**: Auth0 or Firebase Auth for secure user management

- **Cloud Sync**: Firebase Realtime Database or custom API for seamless cross-device synchronization

- **Calendar Integration**: Optional iCal export for syncing with native calendar apps

- **Wearable Integration**: Future integration with Apple Health and Google Fit for fitness-related habits

## Real-Time Features

- **Live Streak Updates**: Instant streak counter refresh upon habit completion

- **Notification Sync**: Real-time push notifications across all user devices

- **Cross-Device Sync**: Automatic habit data synchronization when user logs in on multiple devices

- **Motivational Alerts**: Real-time milestone notifications (e.g., "7-day streak achieved!")

- **Conflict Resolution**: Automatic handling of simultaneous edits across devices with last-write-wins strategy

## Implementation Details

- **Architecture**: Modular, component-based frontend with clear separation of concerns; microservices backend for scalability

- **State Management**: Redux or Context API for frontend state; server-side session management for backend

- **Testing**: Unit tests (Jest/Vitest), integration tests (Supertest), E2E tests (Cypress/Detox)

- **CI/CD**: GitHub Actions for automated testing, linting, and deployment to staging/production

- **Monitoring**: Sentry for error tracking, DataDog for performance monitoring, custom dashboards for key metrics

- **Documentation**: API documentation (Swagger/OpenAPI), component storybook, developer onboarding guide

## MVP Features

- User authentication (email/password signup and login)

- Create, edit, and delete habits with custom names and descriptions

- Daily habit logging with one-tap check-in

- Automatic streak counter and reset logic

- Calendar view showing completion history (7-day and 30-day views)

- Basic statistics dashboard (current streak, longest streak, completion %)

- Optional push notifications at user-defined times

- Local data persistence with cloud backup

- Simple onboarding tutorial

- Dark mode support

## Future Features

- **Advanced Analytics**: Habit correlation analysis, optimal reminder times, completion trend predictions

- **Social Accountability**: Optional friend connections, shared habit challenges, leaderboards (opt-in)

- **AI Recommendations**: Machine learning-powered habit suggestions based on user behavior and goals

- **Habit Templates**: Pre-built habit templates for common goals (fitness, learning, wellness)

- **Integrations**: Apple Health, Google Fit, Spotify, Todoist, Notion

- **Habit Stacking**: UI for linking related habits and building compound routines

- **Export & Reporting**: PDF reports, data export, annual summaries

- **Gamification**: Badges, achievements, milestone celebrations (non-intrusive)

- **Web Dashboard**: Full-featured web app for detailed analytics and habit management

- **Offline Mode**: Full offline functionality with sync when connection restored

## User Experience Guidelines

- **Simplicity First**: Minimize cognitive load; every screen should have a single primary action

- **Visual Feedback**: Immediate visual confirmation of habit completion (animations, color changes, streak updates)

- **Accessibility**: WCAG 2.1 AA compliance, support for screen readers, high-contrast mode

- **Performance**: Instant app launch, <500ms response to user actions, smooth 60fps animations

- **Consistency**: Unified design language, consistent iconography, predictable navigation patterns

- **Onboarding**: Progressive disclosure of features; advanced options hidden until user is ready

- **Error Handling**: Clear, friendly error messages with actionable solutions; never show technical jargon

- **Mobile-First**: Thumb-friendly touch targets (minimum 44x44pt), optimized for one-handed use

- **Personalization**: Allow users to customize habit colors, reminder times, and notification preferences

## Code Quality Standards

- **Language**: TypeScript for type safety and developer experience

- **Linting**: ESLint with Airbnb config, Prettier for code formatting

- **Testing Coverage**: Minimum 80% code coverage for critical paths; 100% for authentication and data persistence

- **Code Reviews**: Mandatory peer review before merge; automated checks for linting, security, and test coverage

- **Documentation**: JSDoc comments for all public functions, README for each module, architecture decision records (ADRs)

- **Git Workflow**: Feature branches, conventional commits, semantic versioning

- **Security**: OWASP Top 10 compliance, regular dependency updates, automated vulnerability scanning (Snyk)

- **Performance**: Lighthouse score >90, bundle size <500KB (gzipped), lazy loading for non-critical features

## Deliverable Format

- **Frontend**: React Native app (iOS/Android) with TypeScript, Redux state management, and responsive UI components

- **Backend**: RESTful API with OpenAPI/Swagger documentation, comprehensive error handling, and rate limiting

- **Database**: PostgreSQL schema with migration scripts, indexed queries for performance

- **Deployment**: Docker containers, Kubernetes orchestration (optional), CI/CD pipeline with automated testing

- **Documentation**: API docs, component storybook, deployment guide, user manual, developer onboarding guide

- **Monitoring**: Error tracking dashboard, performance metrics, user analytics dashboard

- **Release**: App Store and Google Play releases with version management, beta testing program, release notes

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://habit-flow-app-36.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7b7c3c0f-0bd1-4345-9a39-937ab29cd804).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
