/*
 * Minimum Spanning Tree: Rural Internet Connectivity
 * Using Kruskal's Algorithm with Union-Find Data Structure
 * Author: Implementation for Government Initiative Project
 * 
 * COMPILATION: g++ -std=c++11 -o mst_network main.cpp
 * RUN: ./mst_network
 */

#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <cmath>
#include <iomanip>
#include <cstdlib>
#include <ctime>

// Maximum number of vertices
const int MAX_VERTICES = 100;
const int MAX_EDGES = MAX_VERTICES * (MAX_VERTICES - 1) / 2;

// Structure to represent a village (vertex)
struct Village {
    int id;
    double x;
    double y;
    std::string name;
};

// Structure to represent an edge (cable connection)
struct Edge {
    int source;
    int destination;
    double weight;
};

// Union-Find (Disjoint Set) data structure
class UnionFind {
private:
    int parent[MAX_VERTICES];
    int rank[MAX_VERTICES];
    
public:
    // Constructor
    UnionFind(int n) {
        for (int i = 0; i < n; i++) {
            parent[i] = i;
            rank[i] = 0;
        }
    }
    
    // Find with path compression
    int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);
        }
        return parent[x];
    }
    
    // Union by rank
    bool unionSets(int x, int y) {
        int rootX = find(x);
        int rootY = find(y);
        
        if (rootX == rootY) {
            return false; // Already in same set
        }
        
        // Union by rank
        if (rank[rootX] < rank[rootY]) {
            parent[rootX] = rootY;
        } else if (rank[rootX] > rank[rootY]) {
            parent[rootY] = rootX;
        } else {
            parent[rootY] = rootX;
            rank[rootX]++;
        }
        return true;
    }
};

// Graph class for village network
class VillageNetwork {
private:
    Village villages[MAX_VERTICES];
    Edge edges[MAX_EDGES];
    Edge mstEdges[MAX_VERTICES - 1];
    int vertexCount;
    int edgeCount;
    int mstEdgeCount;
    
    // Manual bubble sort for edges (educational purposes)
    void sortEdges() {
        for (int i = 0; i < edgeCount - 1; i++) {
            for (int j = 0; j < edgeCount - i - 1; j++) {
                if (edges[j].weight > edges[j + 1].weight) {
                    Edge temp = edges[j];
                    edges[j] = edges[j + 1];
                    edges[j + 1] = temp;
                }
            }
        }
    }
    
    // Calculate Euclidean distance between two villages
    double calculateDistance(const Village& v1, const Village& v2) {
        double dx = v1.x - v2.x;
        double dy = v1.y - v2.y;
        return sqrt(dx * dx + dy * dy);
    }
    
public:
    // Constructor
    VillageNetwork() : vertexCount(0), edgeCount(0), mstEdgeCount(0) {}
    
    // Add a village to the network
    bool addVillage(int id, double x, double y, const std::string& name) {
        if (vertexCount >= MAX_VERTICES) {
            return false;
        }
        villages[vertexCount].id = id;
        villages[vertexCount].x = x;
        villages[vertexCount].y = y;
        villages[vertexCount].name = name;
        vertexCount++;
        return true;
    }
    
    // Generate all possible edges between villages
    void generateEdges() {
        edgeCount = 0;
        for (int i = 0; i < vertexCount; i++) {
            for (int j = i + 1; j < vertexCount; j++) {
                if (edgeCount < MAX_EDGES) {
                    edges[edgeCount].source = i;
                    edges[edgeCount].destination = j;
                    edges[edgeCount].weight = calculateDistance(villages[i], villages[j]);
                    edgeCount++;
                }
            }
        }
    }
    
    // Kruskal's algorithm to find MST
    void kruskalMST() {
        // Sort edges by weight
        sortEdges();
        
        // Initialize Union-Find
        UnionFind uf(vertexCount);
        
        // Process edges in order
        mstEdgeCount = 0;
        for (int i = 0; i < edgeCount && mstEdgeCount < vertexCount - 1; i++) {
            int source = edges[i].source;
            int dest = edges[i].destination;
            double weight = edges[i].weight;
            
            // Check if adding this edge creates a cycle
            if (uf.unionSets(source, dest)) {
                mstEdges[mstEdgeCount] = edges[i];
                mstEdgeCount++;
            }
        }
    }
    
    // Calculate total cost of MST
    double getTotalCost() {
        double total = 0;
        for (int i = 0; i < mstEdgeCount; i++) {
            total += mstEdges[i].weight;
        }
        return total;
    }
    
    // Verify if MST is valid (connected and acyclic)
    bool verifyMST() {
        // Check if we have exactly V-1 edges
        if (mstEdgeCount != vertexCount - 1) {
            std::cout << "Invalid: MST has " << mstEdgeCount 
                      << " edges, expected " << vertexCount - 1 << std::endl;
            return false;
        }
        
        // Check if MST is connected using Union-Find
        UnionFind uf(vertexCount);
        for (int i = 0; i < mstEdgeCount; i++) {
            uf.unionSets(mstEdges[i].source, mstEdges[i].destination);
        }
        
        int root = uf.find(0);
        for (int i = 1; i < vertexCount; i++) {
            if (uf.find(i) != root) {
                std::cout << "Invalid: MST is not connected" << std::endl;
                return false;
            }
        }
        
        std::cout << "MST Verification: Valid (Connected and Acyclic)" << std::endl;
        return true;
    }
    
    // Display MST edges
    void displayMST() {
        std::cout << "\n========================================" << std::endl;
        std::cout << "MINIMUM SPANNING TREE - CABLE NETWORK" << std::endl;
        std::cout << "========================================" << std::endl;
        std::cout << std::fixed << std::setprecision(2);
        std::cout << "\nVillages Connected (Total: " << vertexCount << " villages)" << std::endl;
        std::cout << "Cables Required: " << mstEdgeCount << " connections" << std::endl;
        std::cout << "\nConnection Details:" << std::endl;
        std::cout << "------------------------------------------------------------" << std::endl;
        std::cout << "From Village\tTo Village\tDistance (km)" << std::endl;
        std::cout << "------------------------------------------------------------" << std::endl;
        
        for (int i = 0; i < mstEdgeCount; i++) {
            std::cout << villages[mstEdges[i].source].name << "\t\t"
                      << villages[mstEdges[i].destination].name << "\t\t"
                      << mstEdges[i].weight << std::endl;
        }
        
        std::cout << "------------------------------------------------------------" << std::endl;
        std::cout << "Total Cable Length Required: " << getTotalCost() << " km" << std::endl;
        std::cout << "========================================\n" << std::endl;
    }
    
    // Generate random villages for testing
    void generateRandomVillages(int count) {
        std::srand(42); // Fixed seed for reproducibility
        vertexCount = 0;
        
        for (int i = 0; i < count && i < MAX_VERTICES; i++) {
            double x = (std::rand() % 10000) / 100.0; // 0-100 km range
            double y = (std::rand() % 10000) / 100.0;
            std::stringstream ss;
            ss << "Village_" << (i + 1);
            addVillage(i, x, y, ss.str());
        }
        
        generateEdges();
        kruskalMST();
    }
    
    // Small graph demonstration (5-6 vertices)
    void demonstrateSmallGraph() {
        std::cout << "\n========================================" << std::endl;
        std::cout << "DEMONSTRATION: Small Graph (6 Villages)" << std::endl;
        std::cout << "========================================\n" << std::endl;
        
        // Clear existing data
        vertexCount = 0;
        
        // Add 6 villages with coordinates
        addVillage(0, 0.0, 0.0, "Alpha");
        addVillage(1, 3.0, 4.0, "Beta");
        addVillage(2, 6.0, 0.0, "Gamma");
        addVillage(3, 4.0, 6.0, "Delta");
        addVillage(4, 8.0, 3.0, "Epsilon");
        addVillage(5, 2.0, 8.0, "Zeta");
        
        // Generate all possible connections
        generateEdges();
        
        // Run Kruskal's algorithm
        kruskalMST();
        
        // Display results
        displayMST();
        
        // Verify MST
        verifyMST();
        
        // Display step-by-step execution
        displayKruskalSteps();
    }
    
    // Show step-by-step execution of Kruskal's algorithm
    void displayKruskalSteps() {
        std::cout << "\n========================================" << std::endl;
        std::cout << "KRUSKAL'S ALGORITHM - STEP BY STEP" << std::endl;
        std::cout << "========================================\n" << std::endl;
        
        // Sort edges for demonstration
        sortEdges();
        
        std::cout << "Step 1: Sort all edges by weight (ascending order)\n" << std::endl;
        std::cout << "Top 10 smallest edges:" << std::endl;
        for (int i = 0; i < 10 && i < edgeCount; i++) {
            std::cout << "  Edge: " << villages[edges[i].source].name 
                      << " - " << villages[edges[i].destination].name
                      << " (Distance: " << edges[i].weight << " km)" << std::endl;
        }
        
        std::cout << "\nStep 2: Process edges in order, adding if no cycle is formed\n" << std::endl;
        
        UnionFind uf(vertexCount);
        int stepEdges = 0;
        
        for (int i = 0; i < edgeCount && stepEdges < vertexCount - 1; i++) {
            int source = edges[i].source;
            int dest = edges[i].destination;
            double weight = edges[i].weight;
            
            std::cout << "Processing edge " << (i + 1) << ": " 
                      << villages[source].name << " - " << villages[dest].name
                      << " (" << weight << " km)" << std::endl;
            
            if (uf.find(source) != uf.find(dest)) {
                uf.unionSets(source, dest);
                stepEdges++;
                std::cout << "  ✓ Added to MST (Edge #" << stepEdges << ")" << std::endl;
            } else {
                std::cout << "  ✗ Skipped (Would create cycle)" << std::endl;
            }
        }
        
        std::cout << "\nStep 3: Result contains " << stepEdges << " edges (V-1 = " 
                  << (vertexCount - 1) << ")" << std::endl;
        std::cout << "Step 4: Verify no cycles and all villages are connected\n" << std::endl;
    }
    
    // Save results to CSV
    void saveResultsToCSV(const std::string& filename) {
        std::ofstream file(filename.c_str());
        if (!file.is_open()) {
            std::cout << "Error: Could not create file " << filename << std::endl;
            return;
        }
        
        file << "MST Network Connections\n";
        file << "Source Village,Destination Village,Distance (km)\n";
        
        for (int i = 0; i < mstEdgeCount; i++) {
            file << villages[mstEdges[i].source].name << ","
                 << villages[mstEdges[i].destination].name << ","
                 << mstEdges[i].weight << "\n";
        }
        
        file << "\nTotal Cable Length (km)," << getTotalCost() << "\n";
        file.close();
        
        std::cout << "Results saved to " << filename << std::endl;
    }
    
    // Get vertex count
    int getVertexCount() const { return vertexCount; }
    
    // Get MST edge count
    int getMSTEdgeCount() const { return mstEdgeCount; }
};

// Main function
int main() {
    std::cout << "========================================" << std::endl;
    std::cout << "RURAL INTERNET CONNECTIVITY PROJECT" << std::endl;
    std::cout << "Minimum Spanning Tree using Kruskal's Algorithm" << std::endl;
    std::cout << "========================================\n" << std::endl;
    
    VillageNetwork network;
    
    // Demonstration with small graph (5-6 vertices)
    std::cout << "Part 1: Demonstration with Small Graph" << std::endl;
    std::cout << "----------------------------------------" << std::endl;
    network.demonstrateSmallGraph();
    
    // Large scale implementation with 100 villages
    std::cout << "\n\nPart 2: Large Scale Implementation" << std::endl;
    std::cout << "----------------------------------------" << std::endl;
    std::cout << "Generating network with 100 villages..." << std::endl;
    
    VillageNetwork largeNetwork;
    largeNetwork.generateRandomVillages(100);
    
    std::cout << "\nLarge Network Statistics:" << std::endl;
    std::cout << "  Number of Villages: " << largeNetwork.getVertexCount() << std::endl;
    std::cout << "  MST Connections: " << largeNetwork.getMSTEdgeCount() << std::endl;
    std::cout << "  Total Cable Length: " << std::fixed << std::setprecision(2) 
              << largeNetwork.getTotalCost() << " km" << std::endl;
    
    // Verify large network
    std::cout << "\nVerifying Large Network MST:" << std::endl;
    largeNetwork.verifyMST();
    
    // Save results
    largeNetwork.saveResultsToCSV("mst_results.csv");
    
    // Complexity Analysis Output
    std::cout << "\n========================================" << std::endl;
    std::cout << "COMPLEXITY ANALYSIS" << std::endl;
    std::cout << "========================================" << std::endl;
    std::cout << "Kruskal's Algorithm Complexity:" << std::endl;
    std::cout << "  - Sorting edges: O(E log E)" << std::endl;
    std::cout << "  - Union-Find operations: O(E α(V))" << std::endl;
    std::cout << "  - Overall: O(E log E)" << std::endl;
    std::cout << "\nWhere:" << std::endl;
    std::cout << "  V = Number of villages = " << largeNetwork.getVertexCount() << std::endl;
    
    long long possibleEdges = (long long)largeNetwork.getVertexCount() * 
                              (largeNetwork.getVertexCount() - 1) / 2;
    std::cout << "  E = Number of possible connections = " << possibleEdges << std::endl;
    std::cout << "  α = Inverse Ackermann function (practically constant)" << std::endl;
    
    std::cout << "\nSpace Complexity: O(V + E)" << std::endl;
    std::cout << "  - Village array: O(V)" << std::endl;
    std::cout << "  - Edge array: O(E)" << std::endl;
    std::cout << "  - Union-Find structures: O(V)" << std::endl;
    
    std::cout << "\n========================================" << std::endl;
    std::cout << "PROJECT COMPLETED SUCCESSFULLY" << std::endl;
    std::cout << "========================================" << std::endl;
    
    return 0;
}