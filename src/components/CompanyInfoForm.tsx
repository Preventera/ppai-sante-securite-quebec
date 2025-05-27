
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, MapPin, User, Calendar, FileText } from "lucide-react";

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
}

interface CompanyInfoFormProps {
  companyInfo: CompanyInfo;
  onCompanyInfoChange: (info: CompanyInfo) => void;
  selectedGroup: string;
}

export function CompanyInfoForm({ companyInfo, onCompanyInfoChange, selectedGroup }: CompanyInfoFormProps) {
  const handleInputChange = (field: keyof CompanyInfo, value: string) => {
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
                <SelectTrigger>
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
