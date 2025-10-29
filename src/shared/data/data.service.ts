import { Injectable } from '@nestjs/common';
import countriesAndNations from './countries_with_nationalities.json';
import { CountriesDto, NationalityDto } from './data.dto';

@Injectable()
export class DataService {
  getAllCountries(): CountriesDto[] {
    return countriesAndNations;
  }

  getCountryByCode(code: string): CountriesDto | undefined {
    return countriesAndNations.find((c) => c.code === code.toUpperCase());
  }

  getNationalities(): NationalityDto[] {
    return countriesAndNations
      .map((c) => ({
        code: c.code,
        nationality: c.nationality,
      }))
      .sort((a, b) => a.nationality.localeCompare(b.nationality));
  }
}
