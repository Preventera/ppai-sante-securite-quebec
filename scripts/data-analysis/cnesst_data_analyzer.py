import pandas as pd
import requests
import json
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import os

class CNESSTDataAnalyzer:
    def __init__(self):
        self.base_url = "https://donneesquebec.ca/recherche/fr/dataset/lesions-professionnelles"
        self.data = None
        self.analysis_results = {}
        
    def find_csv_download_link(self):
        """Trouve automatiquement le lien de téléchargement du CSV"""
        print("🔍 Recherche du lien de téléchargement CSV...")
        
        try:
            response = requests.get(self.base_url)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            csv_links = []
            for link in soup.find_all('a', href=True):
                href = link['href']
                if '.csv' in href.lower() or 'csv' in link.text.lower():
                    full_url = urljoin(self.base_url, href)
                    csv_links.append({
                        'url': full_url,
                        'text': link.text.strip(),
                        'title': link.get('title', '')
                    })
            
            if not csv_links:
                print("❌ Aucun lien CSV trouvé automatiquement")
                return None
                
            print(f"✅ {len(csv_links)} lien(s) CSV trouvé(s):")
            for i, link in enumerate(csv_links):
                print(f"  {i+1}. {link['text']} - {link['url']}")
            
            return csv_links[0]['url']
            
        except Exception as e:
            print(f"❌ Erreur lors de la recherche automatique: {e}")
            return None
    
    def download_cnesst_data(self, max_retries=3):
        """Télécharge les données CNESST avec retry automatique"""
        csv_url = self.find_csv_download_link()
        
        if not csv_url:
            fallback_urls = [
                "https://www.donneesquebec.ca/recherche/dataset/bc5bc5fa-9b23-4dc5-8b4b-8b6c6d64d96e/resource/d5e8e88e-df59-4d37-8f42-4dc89e4f8d4b/download/lesions-professionnelles.csv"
            ]
            print("🔄 Utilisation des URLs de fallback...")
            csv_url = fallback_urls[0]
        
        for attempt in range(max_retries):
            try:
                print(f"📥 Téléchargement des données CNESST (tentative {attempt + 1}/{max_retries})...")
                
                response = requests.get(csv_url, timeout=30)
                response.raise_for_status()
                
                with open('output/cnesst_raw_data.csv', 'wb') as f:
                    f.write(response.content)
                
                print("✅ Téléchargement réussi !")
                return True
                
            except Exception as e:
                print(f"❌ Tentative {attempt + 1} échouée: {e}")
                if attempt == max_retries - 1:
                    print("❌ Échec du téléchargement après tous les essais")
                    return False
        
        return False
    
    def load_and_clean_data(self):
        """Charge et nettoie les données CSV"""
        try:
            print("🔄 Chargement et nettoyage des données...")
            
            # Paramètres robustes pour CSV problématiques
            try:
                self.data = pd.read_csv(
                    'output/cnesst_raw_data.csv', 
                    encoding='utf-8',
                    on_bad_lines='skip',
                    low_memory=False
                )
                print("✅ Données chargées avec succès")
            except:
                # Essai avec d'autres paramètres
                try:
                    self.data = pd.read_csv(
                        'output/cnesst_raw_data.csv', 
                        encoding='latin-1',
                        sep=';',
                        on_bad_lines='skip',
                        low_memory=False
                    )
                    print("✅ Données chargées avec encodage latin-1 et séparateur ';'")
                except:
                    # Dernier essai avec paramètres très permissifs
                    self.data = pd.read_csv(
                        'output/cnesst_raw_data.csv', 
                        encoding='cp1252',
                        sep=None,
                        engine='python',
                        on_bad_lines='skip',
                        low_memory=False
                    )
                    print("✅ Données chargées avec paramètres permissifs")
            
            if self.data is None or len(self.data) == 0:
                raise Exception("Dataset vide après chargement")
            
            print(f"📊 Dataset chargé: {len(self.data)} lignes, {len(self.data.columns)} colonnes")
            print(f"📅 Colonnes disponibles: {list(self.data.columns)}")
            
            return True
            
        except Exception as e:
            print(f"❌ Erreur lors du chargement: {e}")
            return False

    def run_complete_analysis(self):
        """Exécute l'analyse complète"""
        print("🚀 Démarrage de l'analyse complète CNESST...")
        print("="*60)
        
        os.makedirs('output', exist_ok=True)
        
        # 1. Téléchargement
        if not self.download_cnesst_data():
            print("❌ Échec du téléchargement - Arrêt de l'analyse")
            return False
        
        # 2. Chargement
        if not self.load_and_clean_data():
            print("❌ Échec du chargement - Arrêt de l'analyse")
            return False
        
        print("\n" + "="*60)
        print("✅ CHARGEMENT DES DONNÉES RÉUSSI !")
        print("="*60)
        print(f"📊 Nombre de lignes: {len(self.data)}")
        print(f"📊 Nombre de colonnes: {len(self.data.columns)}")
        print(f"📊 Colonnes principales: {list(self.data.columns)[:5]}...")
        
        return True

# Script principal
if __name__ == "__main__":
    analyzer = CNESSTDataAnalyzer()
    analyzer.run_complete_analysis()