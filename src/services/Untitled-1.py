def find_csv_download_link(self):
    """Trouve automatiquement le lien de téléchargement du CSV"""
    print("🔍 Recherche du lien de téléchargement CSV...")
    
    try:
        response = requests.get(self.base_url)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Recherche des liens CSV
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
        
        # Retourne le premier lien trouvé (ou le plus récent)
        return csv_links[0]['url']
        
    except Exception as e:
        print(f"❌ Erreur lors de la recherche automatique: {e}")
        return None

def download_cnesst_data(self, max_retries=3):
    """Télécharge les données CNESST avec retry automatique"""
    csv_url = self.find_csv_download_link()
    
    if not csv_url:
        # URLs de fallback connues
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
            
            # Sauvegarde des données brutes
            with open('cnesst_raw_data.csv', 'wb') as f:
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
        
        # Essai de différents encodages
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                self.data = pd.read_csv('cnesst_raw_data.csv', encoding=encoding)
                print(f"✅ Données chargées avec l'encodage {encoding}")
                break
            except UnicodeDecodeError:
                continue
        
        if self.data is None:
            raise Exception("Impossible de décoder le fichier CSV")
        
        print(f"📊 Dataset chargé: {len(self.data)} lignes, {len(self.data.columns)} colonnes")
        print(f"📅 Colonnes disponibles: {list(self.data.columns)}")
        
        # Nettoyage basique
        self.data = self.data.dropna(subset=['SCIAN'] if 'SCIAN' in self.data.columns else [])
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors du chargement: {e}")
        return False

def analyze_by_sector(self):
    """Analyse des lésions par secteur SCIAN"""
    print("🔍 Analyse par secteur SCIAN...")
    
    # Identification des colonnes importantes
    scian_col = None
    lesion_col = None
    severity_col = None
    
    for col in self.data.columns:
        if 'scian' in col.lower() or 'secteur' in col.lower():
            scian_col = col
        elif 'lésion' in col.lower() or 'lesion' in col.lower() or 'blessure' in col.lower():
            lesion_col = col
        elif 'gravité' in col.lower() or 'gravite' in col.lower() or 'severity' in col.lower():
            severity_col = col
    
    if not scian_col:
        print("❌ Colonne SCIAN non trouvée")
        return
    
    # Analyse par secteur
    sector_analysis = {}
    
    sectors = self.data[scian_col].value_counts().head(20)  # Top 20 secteurs
    
    for sector_code in sectors.index:
        sector_data = self.data[self.data[scian_col] == sector_code]
        
        analysis = {
            'sector_code': sector_code,
            'total_injuries': len(sector_data),
            'frequency_rank': sectors.rank(ascending=False)[sector_code],
            'injury_types': {},
            'severity_distribution': {},
            'yearly_trends': {}
        }
        
        # Types de lésions
        if lesion_col and lesion_col in sector_data.columns:
            injury_types = sector_data[lesion_col].value_counts().head(10)
            analysis['injury_types'] = injury_types.to_dict()
        
        # Distribution de gravité
        if severity_col and severity_col in sector_data.columns:
            severity_dist = sector_data[severity_col].value_counts()
            analysis['severity_distribution'] = severity_dist.to_dict()
        
        # Tendances annuelles (si colonne date disponible)
        date_cols = [col for col in sector_data.columns if 'date' in col.lower() or 'année' in col.lower() or 'annee' in col.lower()]
        if date_cols:
            try:
                yearly_data = sector_data.groupby(pd.to_datetime(sector_data[date_cols[0]]).dt.year).size()
                analysis['yearly_trends'] = yearly_data.to_dict()
            except:
                pass
        
        sector_analysis[str(sector_code)] = analysis
    
    self.analysis_results['by_sector'] = sector_analysis
    print(f"✅ Analyse complétée pour {len(sector_analysis)} secteurs")

def extract_risk_patterns(self):
    """Extrait les patterns de risques pour PPAI"""
    print("🔍 Extraction des patterns de risques...")
    
    risk_patterns = {}
    
    if 'by_sector' not in self.analysis_results:
        print("❌ Analyse par secteur requise d'abord")
        return
    
    for sector_code, sector_data in self.analysis_results['by_sector'].items():
        patterns = {
            'high_frequency_risks': [],
            'severe_risks': [],
            'trending_risks': [],
            'risk_probability': {},
            'preventive_priority': 'medium'
        }
        
        # Risques haute fréquence
        injury_types = sector_data.get('injury_types', {})
        total_injuries = sector_data.get('total_injuries', 1)
        
        for injury_type, count in injury_types.items():
            probability = count / total_injuries
            severity_score = self.estimate_severity(injury_type)
            
            risk_data = {
                'type': injury_type,
                'probability': probability,
                'frequency': count,
                'severity_estimated': severity_score,
                'risk_index': probability * severity_score * 5  # Scale 0-25
            }
            
            patterns['high_frequency_risks'].append(risk_data)
            patterns['risk_probability'][injury_type] = probability
        
        # Priorisation préventive
        if total_injuries > 100:
            patterns['preventive_priority'] = 'high'
        elif total_injuries > 50:
            patterns['preventive_priority'] = 'medium'
        else:
            patterns['preventive_priority'] = 'low'
        
        risk_patterns[sector_code] = patterns
    
    self.analysis_results['risk_patterns'] = risk_patterns
    print(f"✅ Patterns extraits pour {len(risk_patterns)} secteurs")

def estimate_severity(self, injury_description):
    """Estime la gravité d'une lésion basée sur sa description"""
    severity_keywords = {
        5: ['décès', 'mort', 'fatal', 'amputation', 'paralysie'],
        4: ['fracture', 'brûlure', 'grave', 'hospitalisation', 'chirurgie'],
        3: ['entorse', 'luxation', 'coupure', 'contusion'],
        2: ['éraflure', 'égratignure', 'ecchymose', 'légère'],
        1: ['irritation', 'rougeur', 'mineure']
    }
    
    injury_lower = injury_description.lower() if injury_description else ""
    
    for severity, keywords in severity_keywords.items():
        if any(keyword in injury_lower for keyword in keywords):
            return severity
    
    return 3  # Gravité moyenne par défaut

def calculate_probabilities(self):
    """Calcule les probabilités statistiques pour PPAI"""
    print("📊 Calcul des probabilités statistiques...")
    
    if 'risk_patterns' not in self.analysis_results:
        print("❌ Patterns de risques requis d'abord")
        return
    
    stats = {
        'global_statistics': {},
        'sector_benchmarks': {},
        'risk_correlations': {}
    }
    
    # Statistiques globales
    total_sectors = len(self.analysis_results['by_sector'])
    total_injuries = sum(data['total_injuries'] for data in self.analysis_results['by_sector'].values())
    
    stats['global_statistics'] = {
        'total_sectors_analyzed': total_sectors,
        'total_injuries_recorded': total_injuries,
        'average_injuries_per_sector': total_injuries / total_sectors if total_sectors > 0 else 0,
        'analysis_date': datetime.now().isoformat()
    }
    
    # Benchmarks sectoriels
    for sector_code, risk_data in self.analysis_results['risk_patterns'].items():
        sector_info = self.analysis_results['by_sector'][sector_code]
        
        benchmark = {
            'injury_rate': sector_info['total_injuries'],
            'risk_level': risk_data['preventive_priority'],
            'top_risks': [risk['type'] for risk in risk_data['high_frequency_risks'][:5]],
            'sector_rank': sector_info.get('frequency_rank', 0)
        }
        
        stats['sector_benchmarks'][sector_code] = benchmark
    
    self.analysis_results['statistics'] = stats
    print("✅ Probabilités calculées")

def generate_ppai_format(self):
    """Génère le format JSON compatible PPAI"""
    print("🔄 Génération du format PPAI...")
    
    ppai_data = {
        'metadata': {
            'source': 'CNESST Lésions Professionnelles',
            'generated_at': datetime.now().isoformat(),
            'version': '1.0',
            'total_sectors': len(self.analysis_results.get('by_sector', {}))
        },
        'sectors': {},
        'global_insights': self.analysis_results.get('statistics', {})
    }
    
    # Transformation par secteur
    for sector_code, risk_patterns in self.analysis_results.get('risk_patterns', {}).items():
        sector_info = self.analysis_results['by_sector'][sector_code]
        
        ppai_sector = {
            'sector_code': sector_code,
            'total_incidents': sector_info['total_injuries'],
            'priority_level': risk_patterns['preventive_priority'],
            'risks': []
        }
        
        # Transformation des risques
        for risk in risk_patterns['high_frequency_risks'][:10]:  # Top 10
            ppai_risk = {
                'id': f"risk_{sector_code}_{hash(risk['type']) % 10000}",
                'description': risk['type'],
                'category': self.categorize_risk(risk['type']),
                'probability': min(5, max(1, int(risk['probability'] * 5) + 1)),
                'severity': risk['severity_estimated'],
                'frequency': risk['frequency'],
                'risk_index': int(risk['risk_index']),
                'data_source': 'CNESST_historical',
                'recommended_measures': self.suggest_measures(risk['type'])
            }
            ppai_sector['risks'].append(ppai_risk)
        
        ppai_data['sectors'][sector_code] = ppai_sector
    
    # Sauvegarde
    with open('ppai_enhanced_registry.json', 'w', encoding='utf-8') as f:
        json.dump(ppai_data, f, indent=2, ensure_ascii=False)
    
    print("✅ Format PPAI généré: ppai_enhanced_registry.json")
    return ppai_data

def categorize_risk(self, risk_description):
    """Catégorise un risque selon la taxonomie CNESST"""
    categories = {
        'mecanique': ['coincement', 'écrasement', 'heurt', 'collision', 'chute'],
        'chimique': ['brûlure', 'irritation', 'intoxication', 'vapeur'],
        'ergonomique': ['effort', 'posture', 'répétitif', 'manutention'],
        'thermique': ['chaleur', 'froid', 'température'],
        'electrique': ['électrique', 'électrocution', 'courant'],
        'biologique': ['infection', 'virus', 'bactérie'],
        'psychosocial': ['stress', 'fatigue', 'violence']
    }
    
    risk_lower = risk_description.lower() if risk_description else ""
    
    for category, keywords in categories.items():
        if any(keyword in risk_lower for keyword in keywords):
            return category
    
    return 'general'

def suggest_measures(self, risk_type):
    """Suggère des mesures préventives basées sur le type de risque"""
    measures_db = {
        'chute': ['Garde-corps', 'Harnais de sécurité', 'Formation travail en hauteur'],
        'coincement': ['Protecteurs de machines', 'Procédure de verrouillage', 'Formation sécurité machines'],
        'brûlure': ['EPI thermiques', 'Ventilation', 'Procédures manipulation'],
        'effort': ['Aides mécaniques', 'Formation manutention', 'Rotation des tâches']
    }
    
    risk_lower = risk_type.lower() if risk_type else ""
    
    for keyword, measures in measures_db.items():
        if keyword in risk_lower:
            return measures
    
    return ['Formation générale SST', 'Évaluation des risques', 'Équipements de protection']

def create_visualizations(self):
    """Crée des graphiques d'analyse"""
    print("📊 Création des visualisations...")
    
    if not self.analysis_results:
        print("❌ Données d'analyse non disponibles")
        return
    
    plt.style.use('seaborn-v0_8')
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    fig.suptitle('Analyse CNESST - Lésions Professionnelles par Secteur', fontsize=16)
    
    # 1. Top secteurs par nombre de lésions
    if 'by_sector' in self.analysis_results:
        sectors_data = [(code, data['total_injuries']) for code, data in 
                      list(self.analysis_results['by_sector'].items())[:10]]
        sectors, injuries = zip(*sectors_data)
        
        axes[0,0].bar(range(len(sectors)), injuries)
        axes[0,0].set_title('Top 10 Secteurs - Nombre de Lésions')
        axes[0,0].set_xticks(range(len(sectors)))
        axes[0,0].set_xticklabels([f'SCIAN {s}' for s in sectors], rotation=45)
        axes[0,0].set_ylabel('Nombre de lésions')
    
    # 2. Distribution des niveaux de priorité
    if 'risk_patterns' in self.analysis_results:
        priorities = [data['preventive_priority'] for data in 
                     self.analysis_results['risk_patterns'].values()]
        priority_counts = pd.Series(priorities).value_counts()
        
        axes[0,1].pie(priority_counts.values, labels=priority_counts.index, autopct='%1.1f%%')
        axes[0,1].set_title('Distribution des Niveaux de Priorité Préventive')
    
    # 3. Évolution temporelle (si disponible)
    axes[1,0].text(0.5, 0.5, 'Tendances temporelles\n(selon données disponibles)', 
                  ha='center', va='center', transform=axes[1,0].transAxes)
    axes[1,0].set_title('Évolution Temporelle')
    
    # 4. Matrice de risques
    axes[1,1].text(0.5, 0.5, 'Matrice Probabilité/Gravité\n(selon analyse)', 
                  ha='center', va='center', transform=axes[1,1].transAxes)
    axes[1,1].set_title('Matrice des Risques')
    
    plt.tight_layout()
    plt.savefig('cnesst_analysis_charts.png', dpi=300, bbox_inches='tight')
    print("✅ Graphiques sauvegardés: cnesst_analysis_charts.png")

def run_complete_analysis(self):
    """Exécute l'analyse complète"""
    print("🚀 Démarrage de l'analyse complète CNESST...")
    print("="*60)
    
    # 1. Téléchargement
    if not self.download_cnesst_data():
        print("❌ Échec du téléchargement - Arrêt de l'analyse")
        return False
    
    # 2. Chargement
    if not self.load_and_clean_data():
        print("❌ Échec du chargement - Arrêt de l'analyse")
        return False
    
    # 3. Analyses
    self.analyze_by_sector()
    self.extract_risk_patterns()
    self.calculate_probabilities()
    
    # 4. Génération PPAI
    ppai_data = self.generate_ppai_format()
    
    # 5. Visualisations
    self.create_visualizations()
    
    # 6. Résumé
    print("\n" + "="*60)
    print("✅ ANALYSE TERMINÉE AVEC SUCCÈS")
    print("="*60)
    print(f"📊 Secteurs analysés: {len(self.analysis_results.get('by_sector', {}))}")
    print(f"🎯 Patterns de risques extraits: {len(self.analysis_results.get('risk_patterns', {}))}")
    print(f"📋 Fichiers générés:")
    print("   - cnesst_raw_data.csv (données brutes)")
    print("   - ppai_enhanced_registry.json (format PPAI)")
    print("   - cnesst_analysis_charts.png (graphiques)")
    
    return True