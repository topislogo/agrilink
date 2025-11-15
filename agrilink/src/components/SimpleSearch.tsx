"use client";

import React, { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface SimpleSearchProps {
  onSearch: (searchTerm: string) => void;
  onFilter: (filters: any) => void;
}

export function SimpleSearch({ onSearch, onFilter }: SimpleSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const categories = [
    "All Categories",
    "Vegetables", 
    "Fruits",
    "Rice & Grains",
    "Cooking Oil",
    "Livestock",
    "Seeds",
    "Fertilizers",
    "Equipment"
  ];

  const locations = [
    "All Locations",
    "Yangon Region",
    "Mandalay Region", 
    "Bago Region",
    "Sagaing Region",
    "Ayeyarwady Region"
  ];

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search for products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                onChange={(e) => onFilter({ category: e.target.value })}
              >
                {categories.map((category) => (
                  <option key={category} value={category === "All Categories" ? "" : category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                onChange={(e) => onFilter({ location: e.target.value })}
              >
                {locations.map((location) => (
                  <option key={location} value={location === "All Locations" ? "" : location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
