from PIL import Image, ImageChops
import pprint

def color_to_tile(color):
    if color == (255, 255, 255, 255): # sky
        return 0
    elif color == (0, 0, 0, 255): # ground
        return 1
    elif color == (0, 74, 127, 255): # brick
        return 2
    elif color == (127, 51, 0, 255): # bonus
        return 3
    elif color == (91, 127, 0, 255): # pipe
        return 4
    else:
        return 0

def main():
    map_tiles = Image.open("lvl1.png")

    map_pixel_data = map_tiles.load()

    tile_map = [[color_to_tile(map_pixel_data[x, y]) for x in range(0, map_tiles.size[0])]
                  for y in range(0, map_tiles.size[1])]

    print "[\n    ",
    print ",\n    ".join(["[" + ", ".join([str(tile) for tile in row]) + "]" for row in tile_map])
    print "]"

if __name__ == "__main__":
    main()
