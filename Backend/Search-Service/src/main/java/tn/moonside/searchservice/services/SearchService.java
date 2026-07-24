package tn.moonside.searchservice.services;

import tn.moonside.searchservice.dtos.SearchResponse;

public interface SearchService {

    /**
     * Runs the same query string across the users, teams, and posts
     * Elasticsearch indices and returns a grouped, display-ready result.
     */
    SearchResponse search(String query);
}
