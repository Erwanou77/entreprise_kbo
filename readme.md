### Projet de Développement d'une Application Web de Recherche et Consultation d'Entreprises Belges

#### Contexte et Objectif

L'objectif de ce projet est de développer une application web inspirée de **pappers.be**, utilisant les données ouvertes de la Banque-Carrefour des Entreprises (BCE/KBO) de Belgique. L'application permettra aux utilisateurs de rechercher et de consulter des informations sur les entreprises belges, avec des fonctionnalités avancées de recherche et des visualisations de données.

#### Fonctionnalités Principales

1. **Recherche Avancée**
   - **Par numéro d'entreprise** : Permettre aux utilisateurs de rechercher une entreprise spécifique en utilisant son numéro d'identification.
   - **Par nom d'entreprise** : Fournir une recherche basée sur le nom de l'entreprise.
   - **Par activité** : Offrir la possibilité de rechercher des entreprises en fonction de leur secteur d'activité.
   - **Par adresse** : Permettre la recherche d'entreprises situées à une adresse spécifique ou dans une région donnée.

2. **Consultation de Documents**
   - **Comptes annuels** : Afficher les comptes annuels des entreprises, permettant aux utilisateurs de consulter leurs états financiers.
   - **Documents juridiques** : Fournir l'accès à divers documents juridiques liés aux entreprises, comme les statuts et les procès-verbaux d'assemblées générales.
   - **Publications** : Afficher les publications officielles des entreprises, telles que les avis de modifications statutaires et les annonces légales.

3. **Page d'Accueil Enrichie**
   - **Analyse de Données** : Intégrer une section sur la page d'accueil utilisant une régression linéaire ou d'autres techniques analytiques pour offrir des insights sur les entreprises. Par exemple, une analyse des tendances financières par secteur ou une prévision de croissance basée sur les données disponibles.
   - **Visualisations** : Utiliser des graphiques interactifs pour représenter les données de manière visuelle et intuitive.

4. **Gestion des Profils et Listes de Souhaits**
   - **Création de Profil** : Permettre aux utilisateurs de créer et gérer leurs profils, stockant ainsi leurs préférences et historiques de recherche.
   - **Liste de Souhaits** : Offrir une fonctionnalité où les utilisateurs peuvent sélectionner et sauvegarder plusieurs entrées des résultats de recherche dans une liste de souhaits pour une consultation ultérieure.
   - **Grattage Automatisé avec Gestion de Limitation** : Permettre aux utilisateurs de tenter de récupérer en masse des données des entreprises de leur liste de souhaits. Si une limite de requête (throttling) est atteinte, implémenter un mécanisme d'attente pour continuer la récupération des données automatiquement une fois que la limite est levée. Les données complètes seront ensuite envoyées à l'utilisateur une fois prêtes.

#### Exigences Techniques

- **Base de données** : Utiliser une base de données relationnelle pour stocker les informations sur les entreprises et les profils utilisateurs.
- **Backend** : Développer le backend avec un framework moderne tel que Node.js, Django, ou Ruby on Rails.
- **Frontend** : Utiliser un framework frontend comme React
- **API de données ouvertes** : Intégrer les données ouvertes de la BCE/KBO via une API RESTful.
- **Sécurité** : Assurer la sécurité des données et des transactions en utilisant des techniques de cryptage et des protocoles de sécurité modernes.
- **Gestion de la Limitation de Requêtes (Throttling)** : Implémenter des mécanismes de gestion des limites de requêtes, avec des files d'attente et des notifications pour gérer les récupérations de données de manière asynchrone.

#### Gestion de la Limitation de Requêtes (Throttling)

Pour gérer les limitations de requêtes, les points suivants seront proposer:

X. **Suivi des Requêtes** : Enregistrer chaque requête envoyée à l'API et suivre les taux de limitation.
X. **File d'Attente des Requêtes** : Mettre en place un système de file d'attente pour les requêtes lorsque la limite est atteinte.
X. **Traitement Asynchrone** : Utiliser des tâches en arrière-plan (ex : avec Celery pour Django ou Bull pour Node.js) pour continuer à traiter les requêtes en attente.
X. **Notifications** : Envoyer des notifications aux utilisateurs lorsque leurs données sont prêtes à être consultées.

#### Critères d'Évaluation

1. **Fonctionnalité** : La capacité de l'application à répondre aux besoins des utilisateurs en termes de recherche et de consultation des données.
2. **Performance** : L'efficacité et la rapidité de l'application dans la récupération et l'affichage des informations.
3. **Interface Utilisateur** : La convivialité et l'esthétique de l'interface utilisateur.
4. **Innovation** : L'intégration et l'utilisation d'analyses de données avancées pour offrir une valeur ajoutée aux utilisateurs.
5. **Gestion de Throttling** : L'efficacité de la gestion des limitations de requêtes et la satisfaction des utilisateurs quant à la récupération des données.

#### Livrables

- **Prototype Fonctionnel** : Une version opérationnelle de l'application avec toutes les fonctionnalités principales.
- **Documentation Technique** : Un guide détaillant la configuration du système, l'architecture de l'application, et les instructions pour le déploiement.
- **Mécanisme de Throttling** : Documentation sur l'implémentation de la gestion des limitations de requêtes et les résultats de tests de performance.

