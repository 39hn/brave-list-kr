[한국어 README](./README.md)

# List-KR for Brave (English)

This repository provides a version of the [List-KR](https://github.com/List-KR/List-KR) filter that is converted for use with the Brave browser.

## About the Filter

This filter is a conversion of the Korean adblock filter List-KR, made compatible with the Brave browser. Brave does not support some advanced uBlock Origin pre-parsing directives, so the original List-KR cannot be used as-is. This repository provides a version that works out of the box with Brave.

## How to Use

1. Open Brave and go to `brave://settings/shields/filters`
2. Click "Add custom filter list"
3. In the filter list URL field, enter:
   ```
   https://raw.githubusercontent.com/39hn/brave-list-kr/filter/filter/list-kr.txt
   ```
4. Click the "Add" button

## Automatic Updates

This filter is automatically updated every hour via GitHub Actions. Whenever the original List-KR is updated, this filter will also be updated to the latest version.

## References
- List-KR original: https://github.com/List-KR/List-KR
- Brave Shields: https://brave.com/support/adblock-filters/

## License
GPL-3.0-only 