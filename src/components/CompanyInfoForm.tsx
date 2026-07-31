
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Building, MapPin, User, Calendar, FileText } from "lucide-react";
import { SEUIL_EFFECTIF, SEUIL_JOURS_PRESENCE_CSS } from "@/lib/lmrsst";

export interface CompanyInfo {
  companyName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  responsibleName: string;
  responsibleTitle: string;
  responsiblePhone: string;
  responsibleEmail: string;
  scianCode: string;
  scianDescription: string;
  employeeCount: string;
  implementationDate: string;
  revisionDate: string;
  establishmentType: string;
  additionalInfo: string;
  /** L'employeur appartient à une mutuelle de prévention. */
  mutuellePrevention: boolean;
  /** L'établissement est couvert par l'approche par multiétablissements. */
  multietablissements: boolean;
  /**
   * Jours, dans l'année, où l'établissement groupe 20 travailleurs ou plus.
   * Vide = présence permanente présumée, l'hypothèse la plus exigeante.
   */
  joursAtteinteSeuil: string;
}

/** Valeurs initiales, pour que tout appelant parte d'un état complet. */
export const COMPANY_INFO_VIDE: CompanyInfo = {
  companyName: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  responsibleName: "",
  responsibleTitle: "",
  responsiblePhone: "",
  responsibleEmail: "",
  scianCode: "",
  scianDescription: "",
  employeeCount: "",
  implementationDate: "",
  revisionDate: "",
  establishmentType: "",
  additionalInfo: "",
  mutuellePrevention: false,
  multietablissements: false,
  joursAtteinteSeuil: ""
};

interface CompanyInfoFormProps {
  companyInfo: CompanyInfo;
  onCompanyInfoChange: (info: CompanyInfo) => void;
  selectedGroup: string;
}

export function CompanyInfoForm({ companyInfo, onCompanyInfoChange, selectedGroup }: CompanyInfoFormProps) {
  const handleInputChange = (field: keyof CompanyInfo, value: string | boolean) => {
    onCompanyInfoChange({
      ...companyInfo,
      [field]: value
    });
  };

  const employeeRanges = [
    "1-4 employés",
    "5-9 employés", 
    "10-19 employés",
    "20-49 employés",
    "50-99 employés",
    "100-199 employés",
    "200+ employés"
  ];

  const establishmentTypes = [
    "Siège social",
    "Établissement principal",
    "Succursale",
    "Chantier temporaire",
    "Site de production",
    "Bureau administratif",
    "Entrepôt/Distribution",
    "Point de vente"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5 text-sst-blue" />
          Informations de l'Entreprise
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Identification de l'entreprise */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Building className="w-4 h-4" />
            <h4 className="font-medium">1. Identification de l'entreprise</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de la compagnie *</Label>
              <Input
                id="companyName"
                value={companyInfo.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Ex: Entreprise ABC Inc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="establishmentType">Type d'établissement</Label>
              <Select value={companyInfo.establishmentType} onValueChange={(value) => handleInputChange('establishmentType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {establishmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse complète de l'établissement *</Label>
            <Input
              id="address"
              value={companyInfo.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="123 rue Principale"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                value={companyInfo.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Montréal"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="province">Province</Label>
              <Select value={companyInfo.province} onValueChange={(value) => handleInputChange('province', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QC">Québec</SelectItem>
                  <SelectItem value="ON">Ontario</SelectItem>
                  <SelectItem value="BC">Colombie-Britannique</SelectItem>
                  <SelectItem value="AB">Alberta</SelectItem>
                  <SelectItem value="MB">Manitoba</SelectItem>
                  <SelectItem value="SK">Saskatchewan</SelectItem>
                  <SelectItem value="NS">Nouvelle-Écosse</SelectItem>
                  <SelectItem value="NB">Nouveau-Brunswick</SelectItem>
                  <SelectItem value="NL">Terre-Neuve-et-Labrador</SelectItem>
                  <SelectItem value="PE">Île-du-Prince-Édouard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="postalCode">Code postal</Label>
              <Input
                id="postalCode"
                value={companyInfo.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                placeholder="H1A 1A1"
              />
            </div>
          </div>
        </div>

        {/* Responsable du programme */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <User className="w-4 h-4" />
            <h4 className="font-medium">2. Responsable du programme SST</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsibleName">Nom complet *</Label>
              <Input
                id="responsibleName"
                value={companyInfo.responsibleName}
                onChange={(e) => handleInputChange('responsibleName', e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsibleTitle">Titre/Fonction *</Label>
              <Input
                id="responsibleTitle"
                value={companyInfo.responsibleTitle}
                onChange={(e) => handleInputChange('responsibleTitle', e.target.value)}
                placeholder="Coordonnateur SST"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsiblePhone">Téléphone</Label>
              <Input
                id="responsiblePhone"
                value={companyInfo.responsiblePhone}
                onChange={(e) => handleInputChange('responsiblePhone', e.target.value)}
                placeholder="(514) 123-4567"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsibleEmail">Courriel</Label>
              <Input
                id="responsibleEmail"
                type="email"
                value={companyInfo.responsibleEmail}
                onChange={(e) => handleInputChange('responsibleEmail', e.target.value)}
                placeholder="j.dupont@entreprise.com"
              />
            </div>
          </div>
        </div>

        {/* Informations administratives */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <FileText className="w-4 h-4" />
            <h4 className="font-medium">3. Informations administratives</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scianCode">Code SCIAN *</Label>
              <Input
                id="scianCode"
                value={companyInfo.scianCode}
                onChange={(e) => handleInputChange('scianCode', e.target.value)}
                placeholder="Ex: 236118"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="employeeCount">Nombre d'employés *</Label>
              <Select value={companyInfo.employeeCount} onValueChange={(value) => handleInputChange('employeeCount', value)}>
                {/* L'id porte sur le déclencheur, sinon le Label ne référence aucun élément. */}
                <SelectTrigger id="employeeCount">
                  <SelectValue placeholder="Sélectionner la tranche" />
                </SelectTrigger>
                <SelectContent>
                  {employeeRanges.map((range) => (
                    <SelectItem key={range} value={range}>{range}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <fieldset className="border rounded-lg p-4 space-y-3">
            <legend className="text-sm font-medium px-1">
              Situations particulières d'assujettissement
            </legend>

            <div className="flex items-start gap-3">
              <Checkbox
                id="mutuellePrevention"
                checked={companyInfo.mutuellePrevention}
                onCheckedChange={(checked) =>
                  handleInputChange('mutuellePrevention', checked === true)
                }
              />
              <div>
                <Label htmlFor="mutuellePrevention" className="cursor-pointer">
                  L'employeur appartient à une mutuelle de prévention
                </Label>
                <p className="text-xs text-muted-foreground">
                  Le programme de prévention s'impose alors quel que soit l'effectif.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="multietablissements"
                checked={companyInfo.multietablissements}
                onCheckedChange={(checked) =>
                  handleInputChange('multietablissements', checked === true)
                }
              />
              <div>
                <Label htmlFor="multietablissements" className="cursor-pointer">
                  L'établissement est couvert par l'approche par multiétablissements
                </Label>
                <p className="text-xs text-muted-foreground">
                  Un établissement de {SEUIL_EFFECTIF - 1} travailleurs ou moins couvert par un
                  regroupement bascule dans le régime des {SEUIL_EFFECTIF} et plus : programme de
                  prévention, comité et représentant, et plus d'agent de liaison.
                </p>
              </div>
            </div>

            {/* La tranche est libellée « 20-49 employés » : sa borne basse suffit
                à savoir si le seuil est atteint. Sous le seuil, la question des
                jours de présence ne se pose pas. */}
            <div
              className="space-y-2"
              hidden={(parseInt(companyInfo.employeeCount, 10) || 0) < SEUIL_EFFECTIF}
            >
              <Label htmlFor="joursAtteinteSeuil">
                Jours dans l'année à {SEUIL_EFFECTIF} travailleurs ou plus
              </Label>
              <Input
                id="joursAtteinteSeuil"
                type="number"
                min={0}
                max={366}
                value={companyInfo.joursAtteinteSeuil}
                onChange={(e) => handleInputChange('joursAtteinteSeuil', e.target.value)}
                placeholder="Laisser vide si présence permanente"
              />
              <p className="text-xs text-muted-foreground">
                Sous {SEUIL_JOURS_PRESENCE_CSS} jours, le comité de santé et de sécurité n'est pas
                exigé — et le représentant non plus. Champ vide : présence permanente présumée.
              </p>
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="scianDescription">Description de l'activité économique</Label>
            <Textarea
              id="scianDescription"
              value={companyInfo.scianDescription}
              onChange={(e) => handleInputChange('scianDescription', e.target.value)}
              placeholder="Ex: Construction résidentielle unifamiliale"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="implementationDate">Date de mise en œuvre *</Label>
              <Input
                id="implementationDate"
                type="date"
                value={companyInfo.implementationDate}
                onChange={(e) => handleInputChange('implementationDate', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="revisionDate">Prochaine révision</Label>
              <Input
                id="revisionDate"
                type="date"
                value={companyInfo.revisionDate}
                onChange={(e) => handleInputChange('revisionDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Informations additionnelles */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Informations additionnelles</Label>
            <Textarea
              id="additionalInfo"
              value={companyInfo.additionalInfo}
              onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
              placeholder="Spécificités de l'entreprise, conditions particulières, etc."
              rows={3}
            />
          </div>
        </div>

        {/* Aide contextuelle */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-medium text-blue-800 mb-2">💡 Aide - Code SCIAN</h5>
          <p className="text-sm text-blue-700">
            Le code SCIAN (Système de classification des industries de l'Amérique du Nord) 
            est disponible sur le site de Statistique Canada. Il détermine votre groupe CNESST 
            et les obligations spécifiques à votre secteur d'activité.
          </p>
          {selectedGroup && (
            <p className="text-sm text-blue-700 mt-2">
              <strong>Groupe CNESST sélectionné :</strong> Groupe {selectedGroup}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
