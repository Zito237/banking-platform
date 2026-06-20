package com.banking_platform.operator_service.dto;

import java.util.List;

public class OperatorUpdateRequest {

    private String name;
    private String country;
    private List<BusinessRuleRequest> rules;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public List<BusinessRuleRequest> getRules() { return rules; }
    public void setRules(List<BusinessRuleRequest> rules) { this.rules = rules; }
}
