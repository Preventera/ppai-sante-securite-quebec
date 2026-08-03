import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldCheck, Info, ExternalLink } from 'lucide-react'
import {
  categoriePourRegistre,
  mesuresParNiveau,
  mesuresPourGenre,
  mesuresGenreParNiveau,
  REFERENCE_HIERARCHIE,
  type MesureGenre,
  type MesurePrevention
} from '@/lib/prevention'
// `reference` est déjà le nom de la catégorie de référence dans ce composant :
// importer sous alias, sinon l'appel vise la variable locale.
import { INSTRUMENTS, reference as referenceInstrument } from '@/lib/instruments'
import { apportDuFondement } from '@/lib/fondement'

/**
 * Ce que l'article impose en propre : le seuil à partir duquel il s'applique,
 * la norme technique qu'il incorpore.
 *
 * L'EXTRAIT N'EST PAS DÉCORATIF
 *   « 3 m » seul ne dit rien — trois mètres de quoi, mesurés d'où ? Le fragment
 *   de phrase du texte officiel accompagne donc chaque valeur, en infobulle.
 *
 * CE QUI N'EST PAS AFFIRMÉ
 *   Qu'une valeur relevée s'applique à l'établissement. Un seuil est une
 *   condition énoncée par le texte ; c'est l'employeur qui juge si son poste y
 *   entre. Le libellé dit « au texte », pas « chez vous ».
 */
function ConditionsDeLArticle({ fondement }: { fondement?: string }) {
  const apport = useMemo(() => apportDuFondement(fondement), [fondement])
  if (apport.seuils.length === 0 && apport.normes.length === 0) return null

  return (
    <span className="mt-1 flex flex-wrap items-center gap-1">
      {apport.seuils.map(s => (
        <span
          key={`${s.valeur}-${s.unite}`}
          title={`Au texte : « …${s.extrait}… »`}
          className="inline-flex items-center rounded bg-sst-blue/10 px-1.5 py-0.5 text-[11px] text-sst-blue cursor-help"
        >
          {/* Le point décimal sert à comparer, la virgule à lire : le texte
              officiel écrit « 1,5 m » et l'affichage doit le suivre. */}
          {s.valeur.replace('.', ',')} {s.unite}
        </span>
      ))}
      {apport.normes.map(n => (
        <span
          key={n}
          title="Norme technique incorporée par renvoi dans l'article"
          className="inline-flex items-center rounded border border-gray-300 px-1.5 py-0.5 text-[11px] text-gray-600"
        >
          {n}
        </span>
      ))}
    </span>
  )
}

/**
 * Propose les moyens de prévention applicables à la catégorie d'un risque.
 *
 * L'ORDRE N'EST PAS DÉCORATIF
 *   Les mesures sont présentées dans l'ordre de l'article 6 du RMPPÉ, de
 *   l'élimination à la source jusqu'à la protection individuelle. C'est cet
 *   ordre que l'employeur doit privilégier — proposer les six niveaux à plat
 *   reviendrait à laisser croire qu'ils se valent.
 *
 * OBLIGATION ET RECOMMANDATION NE SE MÉLANGENT PAS
 *   Chaque mesure porte sa nature et, pour les obligations, l'instrument qui
 *   la fonde. Un préventionniste doit pouvoir distinguer d'un coup d'œil ce
 *   qu'on lui reprochera de ne pas avoir fait.
 *
 * CE QUI SE PASSE QUAND LA CATÉGORIE NE DIT RIEN
 *   « Autre risque professionnel » regroupe des situations trop diverses pour
 *   qu'une liste unique s'y applique. Le composant le dit et ne propose rien
 *   plutôt que de proposer n'importe quoi.
 */
export function MesuresProposees({
  nom,
  categorie,
  onAjouter
}: {
  /**
   * Libellé du risque. Les risques adoptés depuis une proposition sectorielle
   * portent verbatim leur genre d'accident — c'est ce qui permet de proposer
   * des mesures propres à la situation plutôt qu'à la catégorie.
   */
  nom?: string | null
  /** Catégorie du risque, telle qu'elle figure au registre. */
  categorie: string | null | undefined
  /** Reçoit le texte des mesures retenues, à insérer dans le champ Mesures. */
  onAjouter: (texte: string) => void
}) {
  // Le genre d'accident prime : « chute au même niveau » dit quoi faire, là où
  // « Autre risque professionnel » — 55 % des fiches dérivées — ne dit rien.
  const parGenre = useMemo(() => mesuresPourGenre(nom), [nom])
  const reference = useMemo(() => categoriePourRegistre(categorie), [categorie])

  const [retenues, setRetenues] = useState<Set<string>>(new Set())

  if (!parGenre && !reference) {
    return (
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription className="text-sm">
          {categorie
            ? `Aucune liste de mesures ne correspond à « ${categorie} » : cette catégorie regroupe des situations trop diverses pour qu'une même liste s'y applique. Décrivez les mesures propres à votre établissement.`
            : "Choisissez une catégorie pour voir les moyens de prévention correspondants."}
        </AlertDescription>
      </Alert>
    )
  }

  const groupes = parGenre
    ? mesuresGenreParNiveau(parGenre.mesures)
    : mesuresParNiveau(reference!)

  const titre = parGenre ? parGenre.genre : reference!.nom
  const sousTitre = parGenre
    ? "Mesures propres à ce genre d'accident — nomenclature CNESST"
    : `Mesures de la catégorie « ${reference!.nom} »`

  const basculer = (cle: string) => {
    setRetenues(prev => {
      const suivant = new Set(prev)
      suivant.has(cle) ? suivant.delete(cle) : suivant.add(cle)
      return suivant
    })
  }

  const cle = (m: MesurePrevention) => `${m.niveau}::${m.libelle}`
  const corroborationDe = (m: MesurePrevention) => (m as MesureGenre).corroboration

  const ajouter = () => {
    // Le texte reprend l'ordre de la hiérarchie, pas l'ordre de sélection :
    // c'est celui-là qui a une valeur réglementaire.
    const lignes: string[] = []
    for (const groupe of groupes) {
      const choisies = groupe.mesures.filter(m => retenues.has(cle(m)))
      if (choisies.length === 0) continue
      lignes.push(`${groupe.niveau}. ${groupe.libelleNiveau}`)
      for (const m of choisies) {
        lignes.push(`   • ${m.libelle}${m.fondement ? ` [${m.fondement}]` : ''}`)
      }
    }
    if (lignes.length === 0) return
    onAjouter(lignes.join('\n'))
    setRetenues(new Set())
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="text-sm">
          <p className="font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sst-blue" />
            {titre}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            {sousTitre} · six niveaux dans l'ordre imposé — {REFERENCE_HIERARCHIE}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={ajouter}
          disabled={retenues.size === 0}
        >
          Reprendre {retenues.size > 0 && `(${retenues.size})`}
        </Button>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {groupes.map(groupe => (
          <div key={groupe.niveau}>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-sst-blue tabular-nums">{groupe.niveau}</span>
              <span className="text-sm font-medium">{groupe.libelleNiveau}</span>
            </div>
            <p className="text-xs text-gray-400 italic ml-5 mb-1">{groupe.texteReglementaire}</p>
            <ul className="ml-5 space-y-1.5">
              {groupe.mesures.map(m => (
                <li key={cle(m)} className="flex items-start gap-2">
                  <Checkbox
                    id={cle(m)}
                    checked={retenues.has(cle(m))}
                    onCheckedChange={() => basculer(cle(m))}
                    className="mt-0.5"
                  />
                  <label htmlFor={cle(m)} className="text-sm cursor-pointer">
                    {m.libelle}
                    {m.nature === 'obligation' ? (
                      <Badge variant="outline" className="ml-2 text-[10px] border-amber-600 text-amber-700">
                        obligation
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="ml-2 text-[10px] text-gray-500">
                        recommandé
                      </Badge>
                    )}
                    {(m.fondement || corroborationDe(m)) && (
                      <span className="block text-xs text-gray-500">
                        {m.fondement}
                        {m.fondement && corroborationDe(m) && ' · '}
                        {corroborationDe(m) && (
                          <span className="italic">appui : {corroborationDe(m)}</span>
                        )}
                      </span>
                    )}
                    <ConditionsDeLArticle fondement={m.fondement} />
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {reference && (
      <details className="text-xs text-gray-500">
        <summary className="cursor-pointer">Normes techniques et appuis de recherche</summary>
        <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-200">
          {reference!.normes.length > 0 && (
            <p>
              <span className="font-medium">Normes :</span>{' '}
              {reference!.normes.map(n => n.code).join(' · ')}
            </p>
          )}
          {reference!.recherche.map(r => (
            <p key={r.organisme}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sst-blue hover:underline inline-flex items-center gap-1"
              >
                {r.organisme} <ExternalLink className="w-3 h-3" />
              </a>{' '}
              — {r.objet}
            </p>
          ))}
          {reference!.asp.map(a => (
            <p key={a.nom}>
              <span className="font-medium">{a.nom}</span> — {a.portee}
            </p>
          ))}
        </div>
      </details>
      )}

      <p className="text-xs text-gray-500">
        Ces mesures sont des propositions à adapter : c'est l'employeur qui
        répond de leur pertinence pour son établissement.
      </p>

      {/* Les instruments sont nommés au long et datés, jamais cités à l'article
          tant que leur texte n'a pas été consulté — voir `lib/instruments.ts`. */}
      <details className="text-xs text-gray-500">
        <summary className="cursor-pointer">Textes de référence</summary>
        <ul className="mt-2 space-y-1 pl-2 border-l-2 border-gray-200">
          {INSTRUMENTS.map(i => (
            <li key={i.sigle}>
              <a
                href={i.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sst-blue hover:underline inline-flex items-center gap-1"
              >
                {i.sigle} <ExternalLink className="w-3 h-3" />
              </a>{' '}
              — {referenceInstrument(i)}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
