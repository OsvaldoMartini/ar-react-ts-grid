// src/components/MultiTest/MtI18nBridge.tsx
// ─────────────────────────────────────────────────────────────
// Wraps the entire MultiTest app tree and forces a full re-render
// whenever i18next fires "languageChanged".
//
// How it works:
//   - Listens to i18nInstance.on("languageChanged", ...)
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

  componentDidMount() {
    i18nInstance.on("languageChanged", this.handleLanguageChanged);
  }

  componentWillUnmount() {
    i18nInstance.off("languageChanged", this.handleLanguageChanged);
  }

  render() {
    // The `key` prop forces React to fully remount the child tree
    // whenever the language changes — guaranteeing all class components
    // re-render with fresh translations.
    return (
      <React.Fragment key={this.state.lang}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

export default MtI18nBridge;
