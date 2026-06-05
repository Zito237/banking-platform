# TODO

- [x] Corriger l’affichage Eureka pour éviter que les services s’enregistrent sous le hostname machine (ex: “TAFEMPA”).
- [x] Ajouter dans `config-repo/operator-service.properties` les propriétés Eureka nécessaires pour forcer `localhost` (hostname + instance-id).
- [ ] (Option) Ajouter la même correction dans `config-repo/application.properties` pour tous les microservices si souhaité.

- [ ] Redémarrer `discovery-server` puis `operator-service` et vérifier que Eureka affiche bien `localhost:operator-service:8082`.
- [ ] Mettre à jour ce fichier pour marquer les étapes complétées.

