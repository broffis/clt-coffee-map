# Next Steps: Evaluate WordPress

Use Local to test whether WordPress is a good fit for managing the coffee shop
directory before choosing production hosting or building the frontend. The
broader product plan and open decisions are in [ROADMAP.md](ROADMAP.md).

## 1. Create a local WordPress site

- Create a site in Local and confirm that the WordPress admin dashboard opens.
- Keep local credentials, database files, and other environment-specific data out
  of this repository.

## 2. Prototype shop editing

- Set up a structured shop entry with the fields described in the roadmap,
  including a photo and optional location fields for mobile businesses.
- Add sample entries for a fixed-location shop and a mobile business without a
  fixed location.
- Check that an administrator can add and update entries without changing
  code. Record any plugins or configuration needed.

## 3. Check frontend access

- Retrieve the sample entries through the WordPress REST API.
- Verify that the response includes the structured shop fields and a usable
  reference to each photo.
- Confirm that public shop data can be accessed without exposing private data.

## 4. Check portability

- Test exporting the sample shop data and media, and check that they can be
  restored or imported.
- Note any limitations, additional tools, or manual steps required.

## 5. Review the results

- Assess the editing experience, API access, portability, and plugin needs
  against the roadmap's priorities.
- If WordPress meets those needs, compare managed and self-hosted production
  hosting, including backups, maintenance, and ongoing cost. If not, revisit
  the CMS alternatives in the roadmap.

The proof of concept does not require public user accounts, a production site,
or a finished map.
