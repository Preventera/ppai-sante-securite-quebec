import React from 'react'

/**
 * Filet de sécurité de dernier recours.
 *
 * Sans lui, une exception levée pendant le rendu démonte l'arbre React entier
 * et laisse une page blanche : aucun message, aucune piste, un utilisateur
 * devant un écran vide. C'est exactement ce qui s'est produit lorsque le
 * constructeur du service de génération lisait le stockage local sans
 * précaution — un navigateur refusant le stockage suffisait à tout éteindre.
 *
 * Le repli affiche l'erreur plutôt que de la masquer : sur un déploiement
 * distant, c'est souvent la seule information dont on dispose.
 */

interface Props {
  children: React.ReactNode
}

interface State {
  erreur: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { erreur: null }

  static getDerivedStateFromError(erreur: Error): State {
    return { erreur }
  }

  componentDidCatch(erreur: Error, info: React.ErrorInfo) {
    console.error('[PPAI] Erreur non rattrapée:', erreur, info.componentStack)
  }

  private reinitialiser = () => {
    this.setState({ erreur: null })
  }

  render() {
    const { erreur } = this.state
    if (!erreur) return this.props.children

    return (
      <div
        role="alert"
        style={{
          maxWidth: '42rem',
          margin: '4rem auto',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          lineHeight: 1.6
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          L'application a rencontré une erreur
        </h1>
        <p style={{ marginBottom: '1rem' }}>
          Le reste de l'application n'est pas nécessairement affecté. Vous pouvez réessayer ou
          recharger la page.
        </p>
        <pre
          style={{
            background: '#f4f4f5',
            color: '#18181b',
            padding: '1rem',
            borderRadius: '0.5rem',
            overflowX: 'auto',
            fontSize: '0.8125rem',
            whiteSpace: 'pre-wrap'
          }}
        >
          {erreur.message}
        </pre>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button
            type="button"
            onClick={this.reinitialiser}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #d4d4d8',
              background: '#fff',
              cursor: 'pointer'
            }}
          >
            Réessayer
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: '#1d4ed8',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Recharger la page
          </button>
        </div>
      </div>
    )
  }
}
