# Revue indépendante — sécurité CI et agrégat — 2026-10-30

Revue en contexte neuf, lecture seule, modèle gpt-6-astra/high demandé par le workflow d'exécution. Base0af61dee2141ac15a64f1ab3ca0a169f43b4c0ce, commitd08c2c94550420b2050c1abb1d6607bfd2575944 ; 27fichiers majoritairement preuves/docs. Le correctif du dernier commit prévu porte seulement sur clôture documentaire et empreintes, aucune seconde revue ni modification applicative.

**Verdict : poursuite vers PR admissible, zéro Critical, zéro Important ; aucun Go fusion/production.**

Le reviewer a relancé9/9tests ciblés et actionlint exit0. Il a testé séparément7/7tags invalides contre le vrai script de préparation, dont traversal/substitution/saut de ligne, tous refusés sans sortie créée. Il confirme l'environnement cité, l'égalité stricte du tag au manifeste, l'absence d'écriture/publication, les credentials non persistants et le verrou Vercel global. Il n'a pas refait toutes les suites dont il a lu les journaux : résultats complets attribués à root.

## Findings et dispositions

1. **Minor différé :** tests/ci-hardening.test.js énumère les quatre workflows actuels ; les regex ciblées ne détectent pas toute syntaxe YAML équivalente ni un futur cinquième workflow. Le code actuel est sûr sur les cas examinés. Une future évolution peut découvrir tous les workflows et utiliser un parseur structuré ; ne pas présenter la garde actuelle comme frontière complète contre des contributions malveillantes.
2. **Minor du snapshot d08 :** cases locales du plan encore ouvertes. Root les avait actualisées pendant la revue, avant réception du finding ; le second commit les conserve. Étapes distantes restent décochées. Aucun comportement changé pour polir ce finding.

## Décisions sur chaque limite de revue

- CI/PR/Airtable/absence de déploiement : à contrôler par root au SHA canonique après publication ; aucune fusion/publication entre-temps. Coût si omis : faux Go ; la porte reste ouverte.
- Protections/quota/coût : main et403relus, alerte privée relue sans compteur live, Vercel charges404. La session admin/coût vérifié manquent ; aucun contournement. Coût si mauvais diagnostic : blocage conservateur, aucun droit ou budget élargi.
- Provenance externe : root a obtenu le digest actionlint depuis l'API officielle de release puis vérifié SHA256 avant extraction ; l'agent runtime a vérifié archives officielles Google taille/MD5/CRC. La notification privée n'est pas publiée ; les empreintes seules ne prouvent pas son authenticité. Coût si faux : chaîne d'outillage à requalifier, aucun sceau sécurité globale attribué.
- Suites complètes : root a exécuté232baseline puis241Node,44contrôles Chromium,9SW, builds/lints et préparation positive ; les traces séparées sont conservées. La nouvelle CI doit encore relire le résultat distant. Coût si la reproduction distante diffère : campagne bloquée, pas de retry automatique.
- Historique/actions/dépendances : ascendance prouvée et revues antérieures conservées, audit indépendant ciblé0af et npm courant. Aucun audit exhaustif des40commits/actions tierces n'est inventé. Coût résiduel : défaut historique possible ; main/recette globale restent bloquées.
- Modifications malveillantes futures : permissions actuelles et revue humaine ne valent pas une garantie contre tout futur changement ; réserve Minor ci-dessus maintenue. Coût : garde statique potentiellement incomplète, chaque nouveau workflow exige revue.
- Appareils/WCAG/éviction/crash/versions mixtes/headers/rollback : NOT TESTED ou BLOCKED selon protocole, aucune validation de moteur Linux extrapolée. Coût : ces environnements ne sont pas livrés comme qualifiés.
- OAuth/social/juridique/A/B/C : connecteurs inactifs, aucune action réelle, décisions spécialisées manquantes, NO-GO maintenu. Coût : fonctionnalités connectées indisponibles plutôt qu'activation risquée.
- EOF : normalisation documentaire effectuée, diff --check relu ; aucune vulnérabilité ni perte de fichier. Coût : aucun changement fonctionnel.

Les décisions initiales et leur coût figurent aussi au Ledger du plan. Aucune réserve n'est supprimée par la revue, aucun rerun aveugle ou révision externe demandé.
