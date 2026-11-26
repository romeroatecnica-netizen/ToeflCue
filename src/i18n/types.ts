export interface TranslationBundle {
  seo: {
    title: string;
    description: string;
    howToName: string;
    howToDescription: string;
    howToSteps: Array<{ name: string; text: string }>;
  };
  nav: {
    trainer: string;
    mastery: string;
    guide: string;
    faq: string;
    languageLabel: string;
  };
  hero: {
    h1: string;
    subtitle: string;
  };
  sections: {
    mixed: string;
    reading: string;
    listening: string;
    speaking: string;
    writing: string;
    mistakes: string;
  };
  hud: {
    totalXp: string;
    streak: string;
    accuracy: string;
    mistakesPending: string;
    dailyDays: string;
    questionProgress: string;
    roundScore: string;
  };
  trainer: {
    startNewRound: string;
    showHint: string;
    hideHint: string;
    hintLabel: string;
    checkAnswer: string;
    continueNext: string;
    finishRound: string;
    correctBanner: string;
    incorrectBanner: string;
    removedFromMistakes: string;
    savedToMistakes: string;
    whyOptionsWork: string;
    keyTakeaway: string;
    saveNoteFromDrill: string;
    noteSavedToast: string;
    noMistakesEmptyTitle: string;
    noMistakesEmptyDesc: string;
    switchMixedBtn: string;
    roundCompleteTitle: string;
    roundCompleteSubtitle: string;
    earnedXp: string;
    roundAccuracy: string;
    playAgain: string;
    reviewMissedNow: string;
    keyboardTip: string;
    passageLabel: string;
    speakingPromptLabel: string;
    writingContextLabel: string;
    professorLabel: string;
    readingPointLabel: string;
    lecturePointLabel: string;
  };
  audio: {
    play: string;
    pause: string;
    stop: string;
    speed: string;
    showTranscript: string;
    hideTranscript: string;
    fallbackNotice: string;
    listeningTitle: string;
  };
  timer: {
    title: string;
    prep15: string;
    speak45: string;
    speak60: string;
    write180: string;
    start: string;
    pause: string;
    reset: string;
    timeUp: string;
  };
  chart: {
    title: string;
    subtitle: string;
    targetLine: string;
    attemptsLabel: string;
    emptyState: string;
  };
  dataPanel: {
    title: string;
    subtitle: string;
    exportJson: string;
    importJson: string;
    copyLink: string;
    copiedLink: string;
    printSheet: string;
    resetProgress: string;
    confirmReset: string;
    cancelReset: string;
    importSuccess: string;
    importError: string;
    notesHeading: string;
    noteTitlePlaceholder: string;
    noteContentPlaceholder: string;
    addNote: string;
    deleteNote: string;
  };
  print: {
    title: string;
    generatedOn: string;
    masterySummary: string;
    mistakesReviewTitle: string;
    noMistakesPrint: string;
    correctAnswerLabel: string;
    notesTitle: string;
  };
  ads: {
    label: string;
    slotTopComment: string;
    slotBottomComment: string;
  };
  gear: {
    heading: string;
    subtitle: string;
    disclosure: string;
    cta: string;
    items: Array<{
      title: string;
      category: string;
      description: string;
      url: string;
    }>;
  };
  editorial: {
    guideHeading: string;
    guideIntro: string;
    trapsHeading: string;
    traps: Array<{ title: string; detail: string }>;
    routineHeading: string;
    routineBody: string;
    connectorsHeading: string;
    connectors: Array<{ purpose: string; phrases: string }>;
    faqHeading: string;
    faqs: Array<{ question: string; answer: string }>;
    disclaimer: string;
  };
  footer: {
    copyright: string;
    canonicalNote: string;
  };
}
