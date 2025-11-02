import os

ASSET_FILES = {
    'boug.png',
    'boug2.png',
    'BougMuse3.png',
    'boug3.png',
    'Temple2.png',
    'Temple4.png',
    'niji.webp',
    'Temple6.png',
    'Temple3.png',
    'Temple5.png',
    'Temple.png',
    'TriptychTwin.png',
    'fairy.png',
}

FOLDER = 'latest/public/media/concepts/Root'

folder_files = {f for f in os.listdir(FOLDER) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))}
missing_from_folder = sorted(ASSET_FILES - folder_files)
extra_in_folder = sorted(folder_files - ASSET_FILES)

print('Missing from folder:', missing_from_folder)
print('Extra in folder:', extra_in_folder)
