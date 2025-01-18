import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mapGet',
  pure: true,
  standalone: true
})
export class MapGetPipe implements PipeTransform {

  transform<K, V>(key: K, map: Map<K, V>): V | undefined {
    return map.get(key);
  }

}
