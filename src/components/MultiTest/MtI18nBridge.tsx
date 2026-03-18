// src/components/MultiTest/MtI18nBridge.tsx
// ─────────────────────────────────────────────────────────────
// Wraps the entire MultiTest app tree and forces a full re-render
// whenever i18next fires "languageChanged" OR "initialized".
//
// How it works:
//   - Listens to i18nInstance.on("languageChanged", ...)
//   - Also listens to "initialized" to catch the first async load:
//     HttpBackend loads translations asynchronously, so App.tsx may
//     render before translations arrive — "initialized" fires once
//     the namespace files are fetched and forces a remount.
//   - Updates a state key (`lang`) which is used as React key on children
//   - React sees a new key → unmounts + remounts the child tree
//   - All class components (which can't use hooks) get fresh renders
//     with the new language already set in i18n
//
// Usage in AppShell.tsx — wrap <ThemedShell> (or <App>) with this:
//   <MtI18nBridge>
//     <ThemedShell {...props} />
//   </MtI18nBridge>
// ─────────────────────────────────────────────────────────────

import React from "react";
import i18nInstance from "../../i18n";

interface MtI18nBridgeState {
  lang: string;
}

export class MtI18nBridge extends React.Component<
  { children: React.ReactNode },
  MtI18nBridgeState
> {
  state: MtI18nBridgeState = {
    lang: i18nInstance.language?.slice(0, 2) ?? "en",
  };

  private handleLanguageChanged = (lng: string) => {
    this.setState({ lang: lng.slice(0, 2) });
  };

  // Fired once when HttpBackend finishes loading the namespace files on
  // first boot. At that point App.tsx (a class component) has already
  // rendered with raw keys — bumping the state key forces a full remount
  // so every t() call runs again with translations in place.
  private handleInitialized = () => {
    i18nInstance.off("initialized", this.handleInitialized); // run only once
    const lng = i18nInstance.language?.slice(0, 2) ?? "en";
    this.setState({ lang: lng + "_ready" }); // suffix ensures key change even if lang didn't change
  };

  componentDidMount() {
    i18nInstance.on("languageChanged", this.handleLanguageChanged);
    // Only subscribe to "initialized" if translations aren't ready yet.
    // If i18n is already initialized (e.g. HMR / cached), skip to avoid
    // an unnecessary remount.
    if (!i18nInstance.isInitialized) {
      i18nInstance.on("initialized", this.handleInitialized); // self-unsubscribes inside handleInitialized
    }
  }

  componentWillUnmount() {
    i18nInstance.off("languageChanged", this.handleLanguageChanged);
    i18nInstance.off("initialized", this.handleInitialized);
  }

  render() {
    // The `key` prop forces React to fully remount the child tree
    // whenever the language changes or translations first load —
    // guaranteeing all class components re-render with fresh translations.
    return (
      <React.Fragment key={this.state.lang}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

export default MtI18nBridge;
