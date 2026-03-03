/**
 * Simple i18n composable for FlashCardPro.
 * Stores language preference in localStorage.
 */
const translations: Record<string, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.discover': 'Discover',
    'nav.newDeck': 'New deck',
    'nav.login': 'Log in',
    'nav.signup': 'Sign up',
    'nav.logout': 'Log out',
    'dashboard.title': 'Your Decks',
    'dashboard.description': 'Study or manage your flashcard decks.',
    'dashboard.noDecks': 'No decks yet.',
    'dashboard.createFirst': 'Create your first deck',
    'study.flip': 'Press Space to flip',
    'study.again': 'Again',
    'study.hard': 'Hard',
    'study.good': 'Good',
    'study.easy': 'Easy',
    'study.complete': 'Session Complete!',
    'study.studyAgain': 'Study again',
    'deck.addCard': 'Add card',
    'deck.export': 'Export CSV',
    'deck.import': 'Bulk import',
    'deck.share': 'Share',
    'discover.title': 'Discover decks',
    'discover.search': 'Search decks...',
  },
  es: {
    'nav.home': 'Inicio',
    'nav.discover': 'Descubrir',
    'nav.newDeck': 'Nuevo mazo',
    'nav.login': 'Iniciar sesión',
    'nav.signup': 'Registrarse',
    'nav.logout': 'Cerrar sesión',
    'dashboard.title': 'Tus Mazos',
    'dashboard.description': 'Estudia o gestiona tus mazos de tarjetas.',
    'dashboard.noDecks': 'No hay mazos todavía.',
    'dashboard.createFirst': 'Crea tu primer mazo',
    'study.flip': 'Presiona Espacio para voltear',
    'study.again': 'Otra vez',
    'study.hard': 'Difícil',
    'study.good': 'Bien',
    'study.easy': 'Fácil',
    'study.complete': '¡Sesión Completada!',
    'study.studyAgain': 'Estudiar de nuevo',
    'deck.addCard': 'Agregar tarjeta',
    'deck.export': 'Exportar CSV',
    'deck.import': 'Importar en masa',
    'deck.share': 'Compartir',
    'discover.title': 'Descubrir mazos',
    'discover.search': 'Buscar mazos...',
  },
  fr: {
    'nav.home': 'Accueil',
    'nav.discover': 'Découvrir',
    'nav.newDeck': 'Nouveau paquet',
    'nav.login': 'Connexion',
    'nav.signup': "S'inscrire",
    'nav.logout': 'Déconnexion',
    'dashboard.title': 'Vos Paquets',
    'dashboard.description': 'Étudiez ou gérez vos paquets de cartes.',
    'dashboard.noDecks': "Pas encore de paquets.",
    'dashboard.createFirst': 'Créez votre premier paquet',
    'study.flip': 'Appuyez sur Espace pour retourner',
    'study.again': 'Encore',
    'study.hard': 'Difficile',
    'study.good': 'Bien',
    'study.easy': 'Facile',
    'study.complete': 'Session Terminée !',
    'study.studyAgain': 'Étudier à nouveau',
    'deck.addCard': 'Ajouter une carte',
    'deck.export': 'Exporter CSV',
    'deck.import': 'Import en masse',
    'deck.share': 'Partager',
    'discover.title': 'Découvrir des paquets',
    'discover.search': 'Rechercher des paquets...',
  },
}

const STORAGE_KEY = 'flashcard-pro:locale'

export function useI18n() {
  const locale = useState<string>('i18n:locale', () => 'en')

  function setLocale(newLocale: string) {
    locale.value = newLocale
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, newLocale)
    }
  }

  function t(key: string): string {
    return translations[locale.value]?.[key] ?? translations.en?.[key] ?? key
  }

  const availableLocales = Object.keys(translations)

  onMounted(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && translations[saved]) {
      locale.value = saved
    }
  })

  return { locale, setLocale, t, availableLocales }
}
